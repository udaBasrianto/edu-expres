const { Post, Category } = require('../models');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Show post by slug
exports.show = async (req, res) => {
    try {
        const post = await Post.findOne({
            where: { slug: req.params.slug, status: 'published' },
            include: [{ model: Category, as: 'category' }]
        });

        if (!post) {
            return res.status(404).send('Artikel tidak ditemukan');
        }

        res.render('post-detail', {
            post,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Post show error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Scrape WordPress posts
exports.scrape = async (req, res) => {
    try {
        let { url } = req.body;
        if (!url) {
            return res.redirect('/admin/posts?error=URL wajib diisi');
        }

        url = url.trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        const urlObj = new URL(url);
        const baseUrl = urlObj.origin;

        let scrapedPosts = [];

        // 1. Try WordPress REST API First
        try {
            const apiTarget = `${baseUrl}/wp-json/wp/v2/posts?_embed&per_page=5`;
            console.log('Trying WP REST API:', apiTarget);
            const apiRes = await axios.get(apiTarget, { 
                timeout: 8000,
                headers: { 'Accept': 'application/json' }
            });
            
            if (Array.isArray(apiRes.data)) {
                scrapedPosts = apiRes.data.map(post => ({
                    title: post.title?.rendered || 'Untitled',
                    content: post.content?.rendered || '',
                    imageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
                    link: post.link
                }));
            }
        } catch (apiErr) {
            console.log('WP REST API failed:', apiErr.message);
        }

        // 2. Fallback to HTML Scraping
        if (scrapedPosts.length === 0) {
            console.log('Falling back to HTML scraping for:', url);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            const $ = cheerio.load(response.data);
            
            const articleSelectors = ['article', '.post', '.type-post', '.blog-post', '.entry', '.item', '.hentry'];
            let articles = null;
            
            for (const selector of articleSelectors) {
                if ($(selector).length > 2) {
                    articles = $(selector);
                    break;
                }
            }
            
            if (!articles || articles.length === 0) {
                articles = $('div[class*="post"], div[class*="article"], section[class*="post"]').slice(0, 5);
            }

            articles.each((i, el) => {
                if (i >= 5) return;
                const titleEl = $(el).find('h1, h2, h3, .entry-title, .post-title, a[href*="/20"]').first();
                const title = titleEl.text().trim();
                let link = titleEl.attr('href') || $(el).find('a').attr('href');
                
                if (link && !link.startsWith('http')) link = new URL(link, baseUrl).href;

                let content = $(el).find('.entry-content, .post-content, .article-content, .content, p').first().html();
                let imageUrl = $(el).find('img').attr('src');
                
                if (!imageUrl || imageUrl.includes('base64')) {
                    imageUrl = $(el).find('img').attr('data-src') || $(el).find('img').attr('data-lazy-src') || $(el).find('img').attr('data-original');
                }
                if (imageUrl && !imageUrl.startsWith('http')) imageUrl = new URL(imageUrl, baseUrl).href;

                if (title && link) {
                    scrapedPosts.push({ title, content, imageUrl, link });
                }
            });
        }

        if (scrapedPosts.length === 0) {
            return res.redirect('/admin/posts?error=Tidak dapat menemukan artikel di URL tersebut. Pastikan URL benar atau situs mengizinkan scraping.');
        }

        // 3. Process and Save
        let newCount = 0;
        for (const item of scrapedPosts) {
            // Check if post already exists by title
            const existing = await Post.findOne({ where: { title: item.title } });
            if (!existing) {
                let localImage = null;
                if (item.imageUrl) {
                    try {
                        let imageUrl = item.imageUrl;
                        if (imageUrl.includes('?')) imageUrl = imageUrl.split('?')[0];
                        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
                        const filename = `scraped-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
                        const destPath = path.join(__dirname, '..', 'public', 'uploads', filename);
                        await downloadImage(item.imageUrl, destPath);
                        localImage = filename;
                    } catch (e) {
                        console.error('Image download failed:', e.message);
                    }
                }

                const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
                await Post.create({
                    title: item.title,
                    slug,
                    content: item.content || 'Konten hasil scraping',
                    type: 'article',
                    status: 'published',
                    image: localImage,
                    category_id: null
                });
                newCount++;
            }
        }

        res.redirect(`/admin/posts?success=Berhasil memproses ${scrapedPosts.length} artikel (${newCount} baru).`);

    } catch (error) {
        console.error('Scrape error:', error);
        res.redirect('/admin/posts?error=Gagal scraping: ' + error.message);
    }
};

// Helper to download image with retry and headers
function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                if (response.headers.location) {
                    file.close();
                    fs.unlink(dest, () => {}); // Delete empty file
                    downloadImage(response.headers.location, dest).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Redirect without location header`));
                }
            } else {
                file.close();
                fs.unlink(dest, () => {});
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

// List published posts (API)
exports.list = async (req, res) => {
    try {
        const posts = await Post.findAll({
            where: { status: 'published' },
            include: [{ model: Category, as: 'category' }],
            order: [['created_at', 'DESC']],
            limit: 20
        });
        res.json(posts);
    } catch (error) {
        console.error('Post list error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
