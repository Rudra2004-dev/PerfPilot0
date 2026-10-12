(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-sign-in');
  const stats = document.querySelector('.stats');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu || !menuOverlay) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    mobileMenu.hidden = true;
    menuOverlay.hidden = true;
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu || !menuOverlay) return;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation menu');
    mobileMenu.hidden = false;
    menuOverlay.hidden = false;
    document.body.classList.add('menu-open');
  };

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });
  menuOverlay?.addEventListener('click', closeMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) closeMenu();
  });

  const values = [...document.querySelectorAll('.stat-value')];
  const paintValue = (element, value) => {
    const decimals = Number(element.dataset.decimals || 0);
    element.textContent = value.toFixed(decimals);
  };

  const animateValue = (element, index) => {
    const target = Number(element.dataset.target);
    const duration = 1500 + index * 80;
    const startOffset = 480 + index * 90;

    if (reduceMotion.matches) {
      paintValue(element, target);
      return;
    }

    window.setTimeout(() => {
      const startedAt = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        paintValue(element, target * eased);
        if (progress < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    }, startOffset);
  };

  let counted = false;
  const startCount = () => {
    if (counted) return;
    counted = true;
    values.forEach(animateValue);
  };

  if ('IntersectionObserver' in window && stats) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        startCount();
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(stats);
  } else {
    startCount();
  }
})();

(() => {
  const form = document.querySelector('#chat-input');
  if (!form) return;

  const textarea = document.querySelector('#chat-textarea');
  const fileInput = document.querySelector('#chat-file-input');
  const attachments = document.querySelector('#chat-attachments');
  const sendButton = document.querySelector('#send-button');
  const dropOverlay = document.querySelector('#drop-overlay');
  const status = document.querySelector('#chat-status');
  const attachFiles = document.querySelector('#attach-files');
  const attachImages = document.querySelector('#attach-images');
  const modelTrigger = document.querySelector('#model-trigger');
  const modelMenu = document.querySelector('#model-menu');
  const modelLabel = document.querySelector('#model-label');
  const modelIcon = document.querySelector('.model-current-icon');
  let attachedFiles = [];
  let dragDepth = 0;

  const setStatus = (message) => {
    if (!status) return;
    status.textContent = message;
    status.classList.add('visible');
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => status.classList.remove('visible'), 3200);
  };

  const updateSendState = () => {
    if (sendButton) sendButton.disabled = !textarea?.value.trim() && attachedFiles.length === 0;
  };

  const renderAttachments = () => {
    if (!attachments) return;
    attachments.innerHTML = '';
    attachedFiles.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'attachment-card';
      if (item.preview) {
        const image = document.createElement('img');
        image.src = item.preview;
        image.alt = item.file.name;
        card.append(image);
      } else {
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-file-lines';
        icon.setAttribute('aria-hidden', 'true');
        card.append(icon);
      }
      const name = document.createElement('span');
      name.textContent = item.file.name;
      card.append(name);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'attachment-remove';
      remove.setAttribute('aria-label', `Remove ${item.file.name}`);
      remove.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      remove.addEventListener('click', () => {
        if (item.preview) URL.revokeObjectURL(item.preview);
        attachedFiles = attachedFiles.filter((file) => file.id !== item.id);
        renderAttachments();
        updateSendState();
      });
      card.append(remove);
      attachments.append(card);
    });
  };

  const addFiles = (fileList) => {
    [...fileList].forEach((file) => {
      attachedFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    });
    renderAttachments();
    updateSendState();
  };

  const openFilePicker = (accept) => {
    if (!fileInput) return;
    fileInput.accept = accept;
    fileInput.click();
  };

  attachFiles?.addEventListener('click', () => openFilePicker('image/*,application/pdf,text/*'));
  attachImages?.addEventListener('click', () => openFilePicker('image/*'));
  fileInput?.addEventListener('change', (event) => {
    if (event.target.files?.length) addFiles(event.target.files);
    event.target.value = '';
  });

  form.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragDepth += 1;
    if (event.dataTransfer?.types.includes('Files')) dropOverlay.hidden = false;
  });
  form.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragDepth -= 1;
    if (dragDepth <= 0) {
      dragDepth = 0;
      dropOverlay.hidden = true;
    }
  });
  form.addEventListener('dragover', (event) => event.preventDefault());
  form.addEventListener('drop', (event) => {
    event.preventDefault();
    dragDepth = 0;
    dropOverlay.hidden = true;
    if (event.dataTransfer?.files.length) addFiles(event.dataTransfer.files);
  });

  textarea?.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 68), 180)}px`;
    updateSendState();
  });
  textarea?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!textarea?.value.trim() && attachedFiles.length === 0) return;
    const selected = modelLabel?.textContent || 'Pro';
    setStatus(`Message ready for ${selected} — connect your AI endpoint to continue.`);
    textarea.value = '';
    textarea.style.height = '68px';
    attachedFiles.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    attachedFiles = [];
    renderAttachments();
    updateSendState();
  });

  const closeModelMenu = () => {
    if (!modelMenu || !modelTrigger) return;
    modelMenu.hidden = true;
    modelTrigger.setAttribute('aria-expanded', 'false');
  };
  modelTrigger?.addEventListener('click', () => {
    const open = modelTrigger.getAttribute('aria-expanded') === 'true';
    modelTrigger.setAttribute('aria-expanded', String(!open));
    modelMenu.hidden = open;
  });
  modelMenu?.querySelectorAll('[data-model]').forEach((option) => {
    option.addEventListener('click', () => {
      const icon = option.dataset.icon || 'fa-sparkles';
      modelLabel.textContent = option.dataset.label || 'Pro';
      modelIcon.className = `fa-solid ${icon} model-current-icon`;
      modelTrigger.setAttribute('aria-label', `Model: ${modelLabel.textContent}`);
      modelMenu.querySelectorAll('[data-model]').forEach((item) => item.setAttribute('aria-selected', String(item === option)));
      closeModelMenu();
    });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.model-picker')) closeModelMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModelMenu();
  });

  updateSendState();
})();
