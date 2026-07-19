// Backend API URL (Abhi local server par chal raha hai)
const API_URL = 'https://client-shoesweb-production.up.railway.app/api/products';

let products = [];

// Router Logic: Show Admin Panel or Main Website based on URL parameters
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
        document.getElementById('main-site').style.display = 'none'; 
        document.getElementById('admin-panel').style.display = 'block'; 
    }
    // Load products from Database on page load
    loadProducts();
});

// Mobile Menu
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.getElementById('nav-links');
if(mobileMenu) {
    mobileMenu.addEventListener('click', () => { navLinks.classList.toggle('active'); });
}

// ================= FETCH DATA FROM MONGODB =================
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        products = await response.json();
        
        // Check kon sa page khula hai aur uske hisab se render karo
        if (document.getElementById('admin-panel').style.display === 'block') {
            renderAdminProducts();
        } else {
            displayProducts();
        }
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

// ================= MAIN WEBSITE LOGIC =================
function displayProducts() {
    const productGrid = document.getElementById('product-grid');
    if(!productGrid) return; 
    
    productGrid.innerHTML = ''; 
    
    if (products.length === 0) {
        productGrid.innerHTML = '<p style="text-align:center; width:100%; color:#888;">No products available right now.</p>';
        return;
    }

    products.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('onclick', `openProductModal(${index})`);
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">Rs. ${product.price}</p>
                <p class="product-desc">${product.desc}</p>
                <button class="btn-primary" style="padding: 8px 25px; font-size:14px; margin-top:10px;">View Details</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

const slideRightBtn = document.getElementById('slide-right');
if(slideRightBtn) {
    slideRightBtn.addEventListener('click', () => {
        document.getElementById('product-grid').scrollBy({ left: 310, behavior: 'smooth' });
    });
}

// ================= MODALS (POPUPS) LOGIC =================
const productModal = document.getElementById('product-modal');
const orderModal = document.getElementById('order-modal');
const closeBtns = document.querySelectorAll('.close-btn, .close-order-btn');

window.openProductModal = function(index) {
    const product = products[index];
    document.getElementById('modal-image').src = product.image;
    document.getElementById('modal-title').innerText = product.title;
    document.getElementById('modal-price').innerText = `Rs. ${product.price}`;
    document.getElementById('modal-desc').innerText = product.desc;
    productModal.style.display = 'flex';
}

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        productModal.style.display = 'none';
        orderModal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target == productModal) productModal.style.display = 'none';
    if (e.target == orderModal) orderModal.style.display = 'none';
});

// ================= ADMIN DASHBOARD LOGIC =================
function renderAdminProducts() {
    const adminList = document.getElementById('admin-product-list');
    adminList.innerHTML = '';
    
    if (products.length === 0) {
        adminList.innerHTML = '<p style="text-align:center; color:#888;">No products available.</p>';
        return;
    }

    products.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'admin-product-item';
        item.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${product.image}" alt="Img">
                <div class="admin-product-info">
                    <h4>${product.title}</h4>
                    <p>Rs. ${product.price}</p>
                </div>
            </div>
            <button class="btn-danger" onclick="deleteProduct('${product._id}')"><i class="fas fa-trash"></i> Delete</button>
        `;
        adminList.appendChild(item);
    });
}

// Add New Product (Send to Backend)
const productForm = document.getElementById('product-form');
if (productForm) {
    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('p-title').value;
        const price = document.getElementById('p-price').value;
        const desc = document.getElementById('p-desc').value;
        const imageFile = document.getElementById('p-image').files[0];
        
        if(imageFile) {
            // Loading alert taake pata chale upload ho raha hai
            const submitBtn = document.querySelector('#product-form button[type="submit"]');
            submitBtn.innerText = 'Uploading... Please wait';
            submitBtn.disabled = true;

            // FormData banayen kyunke hum file (image) bhej rahe hain
            const formData = new FormData();
            formData.append('title', title);
            formData.append('price', price);
            formData.append('desc', desc);
            formData.append('image', imageFile);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    alert('Zabardast! Product MongoDB mein save ho gaya hai.');
                    productForm.reset();
                    loadProducts(); // Data dobara mangwa kar list update karo
                } else {
                    alert('Error uploading product!');
                }
            } catch (error) {
                console.error('Upload Error:', error);
                alert('Server error! Please check console.');
            } finally {
                submitBtn.innerText = 'Upload Product';
                submitBtn.disabled = false;
            }
        }
    });
}

// Delete Product (From Backend)
window.deleteProduct = async function(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadProducts(); // List refresh karo
            }
        } catch (error) {
            console.error('Delete Error:', error);
        }
    }
};
