const { Product } = require('./models');
async function run() {
    const list = await Product.findAll();
    console.log(JSON.stringify(list, null, 2));
    process.exit(0);
}
run();
