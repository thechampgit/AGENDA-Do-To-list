document.addEventListener('DOMContentLoaded', () => {
    // Page transition out logic
    const links = document.querySelectorAll('a.nav-btn.transition-link, a.nav-btn:not(.transition-link)');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('http')) {
                e.preventDefault();
                const container = document.querySelector('.app-container');
                if(container) {
                    container.classList.add('page-exit');
                }
                setTimeout(() => {
                    window.location.href = href;
                }, 280); 
            }
        });
    });
});
