// Mobile nav toggle
const burger = document.getElementById('burger');
const links = document.getElementById('links');

if (burger && links) {
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll reveal for cards and skill blocks
const revealTargets = document.querySelectorAll('.project-card, .cert-card, .skill-block');
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in'));
}

// Active navigation scroll spy
const navLinks = document.querySelectorAll('.links a');
const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const navSpy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = '#' + entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
      }
    });
  }, { rootMargin: '-35% 0px -45% 0px' });

  sections.forEach(s => navSpy.observe(s));
}

// Project category filtering
const filterChips = document.querySelectorAll('.filter-chip');
const projectCards = document.querySelectorAll('.project-card');

if (filterChips.length && projectCards.length) {
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      projectCards.forEach(card => {
        const category = card.dataset.category || 'all';
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// Certificate Modal
const modal = document.getElementById('certModal');
const modalImg = document.getElementById('modalImg');
const modalClose = document.getElementById('modalClose');
const modalFallback = document.getElementById('modalFallback');

if (modal && modalImg && modalClose) {
  modalImg.addEventListener('load', () => {
    modal.classList.remove('missing');
  });

  modalImg.addEventListener('error', () => {
    modal.classList.add('missing');
    if (modalFallback) {
      modalFallback.textContent = modalImg.alt || 'ยังไม่มีรูปใบประกาศ';
    }
  });

  document.querySelectorAll('.cert-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.querySelector('.cert-name')?.textContent.trim() || 'Certificate preview';
      modal.classList.remove('missing');
      modalImg.alt = name;
      modalImg.src = card.dataset.img;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modalClose.focus();
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalImg.removeAttribute('src');
  }

  const modalWrap = document.getElementById('modalWrap');
  if (modalWrap) {
    modalWrap.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

// Contact Form AJAX Submission via Netlify Function Proxy
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

if (contactForm && formStatus && submitBtn) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>กำลังส่งข้อความ...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
    formStatus.className = 'form-status';
    formStatus.style.display = 'none';

    const name = contactForm.querySelector('#name').value.trim();
    const email = contactForm.querySelector('#email').value.trim();
    const message = contactForm.querySelector('#message').value.trim();

    try {
      const response = await fetch('/.netlify/functions/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const result = await response.json();

      if (result.success) {
        formStatus.textContent = '✓ ส่งข้อความเรียบร้อยแล้ว ขอบคุณที่ติดต่อเข้ามาครับ!';
        formStatus.className = 'form-status success';
        contactForm.reset();
      } else {
        formStatus.textContent = '✕ เกิดข้อผิดพลาด: ' + (result.message || 'กรุณาลองใหม่อีกครั้ง');
        formStatus.className = 'form-status error';
      }
    } catch (error) {
      formStatus.textContent = '✕ ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อทางอีเมลโดยตรง';
      formStatus.className = 'form-status error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>SEND MESSAGE</span> <i class="fa-solid fa-paper-plane"></i>';
    }
  });
}

