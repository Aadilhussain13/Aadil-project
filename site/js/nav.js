// Hamburger nav toggle and active tab scroll
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      // Animate hamburger icon to X
      const bars = toggle.querySelectorAll('.bar');
      bars.forEach(b => b.classList.toggle('open', isOpen));
    });

    // Close nav when a link is clicked (mobile)
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Scroll active tab into view on desktop
  const active = document.querySelector('nav.tabs .nav-links a.active');
  if (active) active.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });

  // Update toggle label with current page name
  if (toggle) {
    const activeName = active ? active.textContent.trim() : 'Menu';
    const label = toggle.querySelector('.nav-toggle-active');
    if (label) label.textContent = activeName;
  }
});
