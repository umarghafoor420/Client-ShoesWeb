// Backend API URL
const API_URL = 'https://client-shoesweb-production.up.railway.app/api/products';

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let activeModalProduct = null;

// Router Logic: Show Admin Panel or Main Website based on URL parameters
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
        document.getElementById('main-site').style.display = 'none'; 
        document.getElementById('admin-panel').style.display = 'block'; 
    }
    // Load products from Database on page load
    loadProducts();
    updateCartUI();
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
        
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy" onclick="openProductModal(${index})" style="cursor: pointer;">
            <div class="product-info">
                <h3 class="product-title" onclick="openProductModal(${index})" style="cursor: pointer;">${product.title}</h3>
                <p class="product-price">Rs. ${product.price}</p>
                <p class="product-desc">${product.desc}</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn-primary" onclick="openProductModal(${index})" style="padding: 8px 15px; font-size: 13px; flex: 1;">View Details</button>
                    <button onclick="addToCart('${product._id}')" style="background: #27ae60; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 30px; font-weight: bold; font-size: 13px; flex: 1;">Add to Cart</button>
                </div>
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

// ================= CART SYSTEM LOGIC =================
function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item._id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    alert(`${product.title} has been added to your cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item._id !== productId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update Badge Counter
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.innerText = totalCount;
    }

    // Update Cart Drawer Items
    const container = document.getElementById('cart-items-container');
    const totalContainer = document.getElementById('cart-total');
    if (!container || !totalContainer) return;

    container.innerHTML = '';
    let totalPrice = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777; margin-top: 20px;">Your cart is empty.</p>';
        totalContainer.innerText = '0';
        return;
    }

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        
        cartItemEl.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>Rs. ${item.price} x ${item.quantity}</p>
            </div>
            <button class="btn-remove-cart" onclick="removeFromCart('${item._id}')">Remove</button>
        `;
        container.appendChild(cartItemEl);
    });

    totalContainer.innerText = totalPrice;
}

function toggleCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    }
}

// Open Checkout Modal from Cart Drawer
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    toggleCartModal(); // Close cart drawer
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'flex';
    }
}

// Open Checkout Modal Directly from Product Details Modal "Place Order" button
function openCheckoutModalDirect() {
    const productModal = document.getElementById('product-modal');
    if (productModal) productModal.style.display = 'none';

    if (activeModalProduct) {
        // Is specific product ko temporary cart mein daal kar checkout khol dein
        cart = [{ ...activeModalProduct, quantity: 1 }];
        saveCart();
        updateCartUI();
    }

    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'flex';
    }
}

function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}

// Submit Order and Forward to WhatsApp
function submitOrderToWhatsApp(e) {
    e.preventDefault();

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const payAccount = document.getElementById('pay-account').value;

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    let orderItemsText = '';
    let totalPrice = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        orderItemsText += `${index + 1}. ${item.title} (Qty: ${item.quantity}) - Rs. ${itemTotal}\n`;
    });

    // Format WhatsApp Message
    let message = `*New Order Received - Premier Foot Wear*\n\n`;
    message += `*Customer Details:*\n`;
    message += `• Name: ${name}\n`;
    message += `• Phone: ${phone}\n`;
    message += `• Address: ${address}\n\n`;
    message += `*Order Items:*\n${orderItemsText}\n`;
    message += `*Total Amount:* Rs. ${totalPrice}\n`;
    message += `*Payment Account:* ${payAccount}\n`;
    message += `*(Payment Screenshot uploaded by customer)*`;

    // Determine target WhatsApp number based on selected account
    let targetWhatsAppNumber = "923112919430"; // Faisal Sheikh
    if (payAccount.includes("0335-2168822")) {
        targetWhatsAppNumber = "923352168822"; // Waqar Sheikh
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodedMessage}`;

    alert('Order details prepared! Redirecting to WhatsApp to send message and screenshot.');
    
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();
    document.getElementById('checkout-form').reset();

    window.open(whatsappUrl, '_blank');
}

// ================= MODALS (POPUPS) LOGIC =================
const productModal = document.getElementById('product-modal');
const orderModal = document.getElementById('order-modal');
const closeBtns = document.querySelectorAll('.close-btn, .close-order-btn');

window.openProductModal = function(index) {
    const product = products[index];
    if (!product) return;

    activeModalProduct = product; // Save active product reference for direct checkout

    document.getElementById('modal-image').src = product.image;
    document.getElementById('modal-title').innerText = product.title;
    document.getElementById('modal-price').innerText = `Rs. ${product.price}`;
    document.getElementById('modal-desc').innerText = product.desc;
    
    // Set Add to Cart button action dynamically
    const addCartBtn = document.getElementById('modal-add-cart-btn');
    if (addCartBtn) {
        addCartBtn.setAttribute('onclick', `addToCart('${product._id}')`);
    }

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
    if (e.target == document.getElementById('checkout-modal')) closeCheckoutModal();
});

// ================= ADMIN DASHBOARD LOGIC =================
function renderAdminProducts() {
    const adminList = document.getElementById('admin-product-list');
    if(!adminList) return;
    
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
            const submitBtn = document.querySelector('#product-form button[type="submit"]');
            submitBtn.innerText = 'Uploading... Please wait';
            submitBtn.disabled = true;

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
                    loadProducts();
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
                loadProducts();
            }
        } catch (error) {
            console.error('Delete Error:', error);
        }
    }
};
