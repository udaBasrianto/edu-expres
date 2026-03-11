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
        const { url } = req.body;
        if (!url) {
            return res.redirect('/admin/posts?error=URL wajib diisi');
        }

        // Fetch HTML content with headers to mimic browser
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        
        // Try to find posts based on common WordPress selectors
        const articleSelectors = ['article', '.post', '.type-post', '.blog-post', '.hentry'];
        let articles = null;
        
        for (const selector of articleSelectors) {
            if ($(selector).length > 0) {
                articles = $(selector);
                break;
            }
        }
        
        if (!articles || articles.length === 0) {
             // Fallback: try to find any div that looks like a post list
             articles = $('div[class*="post"], div[class*="article"]').slice(0, 10);
             if (articles.length === 0) {
                return res.redirect('/admin/posts?error=Tidak dapat menemukan artikel dengan selector umum');
             }
        }

        const promises = [];
        const baseUrl = new URL(url).origin;

        articles.each((i, el) => {
            if (i >= 5) return; // Limit to 5 posts per scrape

            const titleEl = $(el).find('h2, h3, h1, .entry-title, .post-title').first();
            const title = titleEl.text().trim();
            let link = $(el).find('a').attr('href');
            
            // Fix relative links
            if (link && !link.startsWith('http')) {
                link = new URL(link, baseUrl).href;
            }

            // Try to find content
            let content = $(el).find('.entry-content, .post-content, .article-content, .content').html();
            if (!content) content = $(el).find('p').first().text();

            // Try to find image with various attributes
            let imageUrl = $(el).find('img').attr('src');
            // Handle lazy loading attributes often used in WP
            if (!imageUrl || imageUrl.includes('base64')) {
                imageUrl = $(el).find('img').attr('data-src') || 
                          $(el).find('img').attr('data-lazy-src') ||
                          $(el).find('img').attr('data-original') ||
                          $(el).find('.post-thumbnail img').attr('src');
            }
            
            // Fix relative image URLs
            if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = new URL(imageUrl, baseUrl).href;
            }

            // Clean up query parameters from image URL (optional, but good for some CDNs)
            // if (imageUrl) imageUrl = imageUrl.split('?')[0];

            if (title && link) {
                promises.push((async () => {
                    // Check if post already exists
                    const existing = await Post.findOne({ where: { title } });
                    if (!existing) {
                        let localImage = null;
                        
                        // Download image if exists
                        if (imageUrl) {
                            try {
                                const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
                                const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                                const finalExt = validExts.includes(ext.toLowerCase()) ? ext : '.jpg';
                                
                                const filename = 'scraped-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + finalExt;
                                const destPath = path.join(__dirname, '..', 'public', 'uploads', filename);
                                
                                await downloadImage(imageUrl, destPath);
                                localImage = filename;
                            } catch (imgErr) {
                                console.error(`Failed to download image from ${imageUrl}:`, imgErr.message);
                            }
                        }

                        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
                        
                        await Post.create({
                            title,
                            slug,
                            content: content || 'Konten hasil scraping',
                            type: 'article',
                            status: 'draft', // Default to draft for review
                            image: localImage,
                            category_id: null // Or set a default scraped category
                        });
                        return true;
                    }
                    return false;
                })());
            }
        });

        const results = await Promise.all(promises);
        const count = results.filter(r => r).length;

        if (count > 0) {
            res.redirect(`/admin/posts?success=Berhasil scrape ${count} artikel baru`);
        } else {
            res.redirect('/admin/posts?info=Tidak ada artikel baru yang ditemukan (mungkin duplikat)');
        }
    } catch (error) {
        console.error('Scrape error:', error);
        res.redirect('/admin/posts?error=Gagal melakukan scraping: ' + error.message);
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
