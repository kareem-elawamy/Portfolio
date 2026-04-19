// Tracking Scroll Progress logic
const initScrollProgress = () => {
    const scrollFill = document.getElementById('scroll-fill');
    const scrollFillMobile = document.getElementById('scroll-fill-mobile');
    const scrollPercentageTxt = document.getElementById('scroll-percentage');

    const updateScrollProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        let scrollFraction = docHeight > 0 ? scrollTop / docHeight : 0;
        scrollFraction = Math.max(0, Math.min(1, scrollFraction)); // clamp 0-1

        const percent = Math.round(scrollFraction * 100);

        // Update vertical tube height
        if (scrollFill) scrollFill.style.height = `${scrollFraction * 100}%`;

        // Update percentage floating text
        if (scrollPercentageTxt) {
            scrollPercentageTxt.innerText = `${percent}%`;
            scrollPercentageTxt.style.top = `${scrollFraction * 100}%`;

            // Subtle glowing text color change at bottom
            if (percent === 100) {
                scrollPercentageTxt.classList.add('text-secondary', 'border-secondary/50');
                scrollPercentageTxt.classList.remove('text-primary', 'border-primary/30');
            } else {
                scrollPercentageTxt.classList.remove('text-secondary', 'border-secondary/50');
                scrollPercentageTxt.classList.add('text-primary', 'border-primary/30');
            }
        }

        // Update mobile top bar width
        if (scrollFillMobile) scrollFillMobile.style.width = `${scrollFraction * 100}%`;
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    updateScrollProgress(); // Initial call
};

// Splash Screen Logic
document.addEventListener("DOMContentLoaded", () => {
    // Initialize progress bar
    initScrollProgress();

    // === Scroll Reveal Observer ===
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('[data-reveal]').forEach(el => {
        revealObserver.observe(el);
    });

    const splash = document.getElementById('splash');

    // === SPLASH: Code Rain Canvas ===
    const rainCanvas = document.getElementById('splash-rain');
    if (rainCanvas && splash) {
        const ctx = rainCanvas.getContext('2d');
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;

        const chars = '01{}[]<>/\\|=+-*&^%$#@!;:const let var fn()=>async await import export class new return if else for while .NET Angular C# SignalR';
        const charArr = chars.split('');
        const fontSize = 13;
        const columns = Math.floor(rainCanvas.width / fontSize);
        const drops = new Array(columns).fill(1);

        let rainAnimId;
        function drawRain() {
            ctx.fillStyle = 'rgba(5, 5, 8, 0.06)';
            ctx.fillRect(0, 0, rainCanvas.width, rainCanvas.height);

            for (let i = 0; i < drops.length; i++) {
                const char = charArr[Math.floor(Math.random() * charArr.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Color variety: cyan / purple / blue
                const colorRng = Math.random();
                if (colorRng < 0.5) {
                    ctx.fillStyle = 'rgba(143, 245, 255, 0.35)';
                } else if (colorRng < 0.8) {
                    ctx.fillStyle = 'rgba(172, 138, 255, 0.3)';
                } else {
                    ctx.fillStyle = 'rgba(101, 175, 255, 0.3)';
                }

                ctx.font = `${fontSize}px monospace`;
                ctx.fillText(char, x, y);

                if (y > rainCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            rainAnimId = requestAnimationFrame(drawRain);
        }
        drawRain();

        // === SPLASH: Terminal Typing ===
        const typedEl = document.getElementById('splash-typed');
        const typingText = 'npx kareem-portfolio --init';
        let charIdx = 0;
        function typeChar() {
            if (typedEl && charIdx < typingText.length) {
                typedEl.textContent += typingText[charIdx];
                charIdx++;
                setTimeout(typeChar, 50 + Math.random() * 60);
            }
        }
        setTimeout(typeChar, 400);

        // Fade out after 3 seconds
        setTimeout(() => {
            splash.classList.add('opacity-0');
            splash.style.pointerEvents = 'none';
            cancelAnimationFrame(rainAnimId);

            setTimeout(() => {
                splash.classList.add('hidden');
            }, 1000);
        }, 3000);
    }

    // Modal interactivity
    const modal = document.getElementById('project-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal');
    const imgContainer = document.getElementById('modal-image-container');
    const textContainer = document.getElementById('modal-text-container');

    const openModal = (title, desc, badgesHtml, imageSrc, githubUrl, demoUrl) => {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-desc').innerHTML = desc;
        document.getElementById('modal-badges').innerHTML = badgesHtml;
        const imgEl = document.getElementById('modal-image');

        if (imageSrc && imageSrc.trim() !== '') {
            imgEl.src = imageSrc;
            imgContainer.classList.remove('hidden');
            textContainer.classList.add('md:w-1/2');
        } else {
            imgContainer.classList.add('hidden');
            textContainer.classList.remove('md:w-1/2');
        }

        // Handle GitHub link
        const ghLink = document.getElementById('modal-github-link');
        if (githubUrl && githubUrl.trim() !== '') {
            ghLink.href = githubUrl;
            ghLink.classList.remove('hidden');
        } else {
            ghLink.classList.add('hidden');
        }

        // Handle Demo link
        const demoLink = document.getElementById('modal-demo-link');
        if (demoUrl && demoUrl.trim() !== '') {
            demoLink.href = demoUrl;
            demoLink.classList.remove('hidden');
        } else {
            demoLink.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        setTimeout(() => {
            modal.classList.remove('pointer-events-none');
            modalBackdrop.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95', 'opacity-0', 'translate-y-8');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (!modalBackdrop || !modalContent) return;
        modalBackdrop.classList.add('opacity-0');
        modalContent.classList.add('scale-95', 'opacity-0', 'translate-y-8');
        modal.classList.add('pointer-events-none');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 500);
        document.body.style.overflow = 'auto';
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Bind project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            openModal(
                card.dataset.title,
                card.dataset.desc,
                card.dataset.badges,
                card.dataset.img,
                card.dataset.github,
                card.dataset.demo
            );
        });
    });
});
