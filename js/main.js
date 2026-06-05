document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.chips').forEach(group => {
    group.addEventListener('click', event => {
      const button = event.target.closest('.chip');
      if (!button) return;
      group.querySelectorAll('.chip').forEach(chip => chip.classList.remove('chip--active'));
      button.classList.add('chip--active');
    });
  });

  document.querySelector('.rsvp-form')?.addEventListener('submit', event => {
    event.preventDefault();
  });
});
