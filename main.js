document.addEventListener('DOMContentLoaded', () => {
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCart = document.getElementById('close-cart');
    const cartIcon = document.querySelector('.cart-icon');
    const reveals = document.querySelectorAll('.reveal');

    // GLOBAL CLICK DELEGATION (Para elementos dinámicos)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-add-cart, .cart-icon');
        
        if (target) {
            e.preventDefault();
            if (cartSidebar) cartSidebar.classList.add('active');
        }

        // Cerrar si hace clic en el botón de cerrar
        if (e.target.closest('#close-cart')) {
            if (cartSidebar) cartSidebar.classList.remove('active');
        }

        // Cerrar si hace clic fuera del carrito
        if (cartSidebar && cartSidebar.classList.contains('active') && !cartSidebar.contains(e.target) && !target) {
            cartSidebar.classList.remove('active');
        }
    });

    // Removemos los listeners viejos para evitar conflictos
    /*
    if (cartIcon) { ... }
    if (closeCart) { ... }
    document.addEventListener('click', (e) => { ... });
    */

    // Reveal elements on scroll
    function revealOnScroll() {
        reveals.forEach(el => {
            const windowHeight = window.innerHeight;
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 100;

            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // INFINITE SCROLL LOGIC
    const productGrid = document.querySelector('.product-grid');
    const isHomePage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    let loadCount = 0;
    const MAX_HOME_LOADS = 2; // Total 3 filas (la inicial + 2 cargas)

    const sentinel = document.getElementById('shop-sentinel') || document.createElement('div');
    if (!document.getElementById('shop-sentinel') && productGrid) {
        productGrid.after(sentinel);
    }

    const TOTAL_PRODUCTS_AVAILABLE = 12; // Máximo de productos a cargar en total
    let totalLoaded = 0;

    if (productGrid) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const canLoadHome = isHomePage && loadCount < MAX_HOME_LOADS;
                const canLoadShop = !isHomePage && totalLoaded < TOTAL_PRODUCTS_AVAILABLE;

                if (canLoadHome || canLoadShop) {
                    loadMoreProducts();
                    loadCount++;
                    totalLoaded += 4; // Cargamos de a 4
                } else if (!canLoadHome && isHomePage) {
                    observer.unobserve(sentinel);
                } else if (!canLoadShop && !isHomePage) {
                    observer.unobserve(sentinel);
                    sentinel.innerHTML = "<p style='text-align:center; padding: 4rem; opacity:0.5; font-size:0.8rem; letter-spacing:2px;'>HAS VISTO TODA NUESTRA SELECCIÓN</p>";
                }
            }
        }, { threshold: 0.1 });

        observer.observe(sentinel);
    }

    function loadMoreProducts() {
        const moreProducts = [
            { name: 'Combo Experiencia', price: '$185.000', img: 'caja-oasis.png' },
            { name: 'Juguete Premium', price: '$320.000', img: 'juguete.png' },
            { name: 'Seda Relax', price: '$85.000', img: 'seda.png' },
            { name: 'Aceite Oasis', price: '$55.000', img: 'seda.png' }
        ];

        moreProducts.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'product-card stagger-item';
            card.style.animationDelay = `${index * 0.15}s`;
            card.innerHTML = `
                <a href="product-single.html" style="text-decoration: none; color: inherit;">
                    <div class="product-img" style="background-image: url('${p.img}');"></div>
                </a>
                <div class="product-info">
                    <span class="category">Selección Oasis</span>
                    <h3>${p.name}</h3>
                    <p class="price">${p.price} COP</p>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <a href="#" class="btn-action btn-add-cart" style="flex: 1.2; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i data-lucide="shopping-cart" style="width: 14px;"></i> AÑADIR
                        </a>
                        <a href="product-single.html" class="btn-outline" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i data-lucide="eye" style="width: 14px;"></i> DETALLE
                        </a>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    // La delegación de clics global arriba se encarga de esto ahora.

    // HERO SLIDER LOGIC
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlideIdx = 0;
    let sliderInterval;

    function showSlide(idx) {
        if (slides.length === 0) return;
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[idx].classList.add('active');
        dots[idx].classList.add('active');
        currentSlideIdx = idx;
        resetInterval();
    }

    function nextSlide() {
        if (slides.length === 0) return;
        let next = (currentSlideIdx + 1) % slides.length;
        showSlide(next);
    }

    function prevSlide() {
        if (slides.length === 0) return;
        let prev = (currentSlideIdx - 1 + slides.length) % slides.length;
        showSlide(prev);
    }

    function resetInterval() {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 6000);
    }

    if (slides.length > 0) {
        resetInterval();
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
        });
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    }

    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
