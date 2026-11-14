(function () {
  "use strict";

  var config = window.SIDAD_CONFIG || {};
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sections = ["servicos", "sobre", "como-funciona", "contato"]
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function setInert(element, value) {
    if (!element) return;
    if (value) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  }

  function getFocusable(element) {
    if (!element) return [];
    return Array.prototype.slice.call(
      element.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  var yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  var ticking = false;

  function updateOnScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (!sections.length || !navLinks.length) return;

    var offset = (header ? header.offsetHeight : 0) + 120;
    var current = "";

    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= offset && rect.bottom > offset) {
        current = section.id;
      }
    });

    navLinks.forEach(function (link) {
      var hash = (link.getAttribute("href") || "").split("#")[1];
      if (hash && hash === current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateOnScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateOnScroll();

  if (navToggle && mobileMenu) {
    var menuOpen = false;

    function closeMenu(restoreFocus) {
      if (!menuOpen) return;
      menuOpen = false;
      mobileMenu.classList.remove("is-open");
      setInert(mobileMenu, true);
      document.body.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menu");
      document.removeEventListener("keydown", onMenuKeydown);
      if (restoreFocus !== false) {
        navToggle.focus();
      }
    }

    function openMenu() {
      if (menuOpen) return;
      menuOpen = true;
      setInert(mobileMenu, false);
      window.requestAnimationFrame(function () {
        mobileMenu.classList.add("is-open");
      });
      document.body.classList.add("menu-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Fechar menu");
      document.addEventListener("keydown", onMenuKeydown);
      var focusable = getFocusable(mobileMenu);
      window.setTimeout(function () {
        if (focusable.length) focusable[0].focus();
      }, 60);
    }

    function onMenuKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      var focusable = getFocusable(mobileMenu);
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    navToggle.addEventListener("click", function () {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeMenu(false);
      }
    });

    var desktopQuery = window.matchMedia("(min-width: 901px)");
    var onDesktopChange = function (event) {
      if (event.matches) {
        closeMenu(false);
      }
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(onDesktopChange);
    }
  }

  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (reveals.length) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (element) {
        element.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      reveals.forEach(function (element) {
        observer.observe(element);
      });
    }
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function normalizeWhatsApp(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10 || digits.length === 11) {
      digits = "55" + digits;
    }
    if (digits.length < 12 || digits.length > 13) {
      return "";
    }
    return digits;
  }

  function whatsappUrl(digits, message) {
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message);
  }

  function emailUrl(address, subject, body) {
    return "mailto:" + address + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  var whatsappDigits = normalizeWhatsApp(config.whatsapp);
  var emailAddress = String(config.email || "").trim();
  var hasEmail = isEmail(emailAddress);
  var formEndpoint = String(config.formEndpoint || "").trim();
  var defaultWhatsAppMessage =
    "Olá, vim pelo site da SIDAD e gostaria de falar sobre automação e serviços para meu estabelecimento.";

  function createChannel(label, detail, href, external) {
    var link = document.createElement("a");
    link.className = "channel";
    link.href = href;
    link.setAttribute("aria-label", label + " — " + detail + (external ? " (abre em nova aba)" : ""));
    if (external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    var text = document.createElement("span");
    text.textContent = label;

    var small = document.createElement("small");
    small.textContent = detail;
    text.appendChild(small);
    link.appendChild(text);

    var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 8h10M9 4l4 4-4 4");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    icon.appendChild(path);
    link.appendChild(icon);

    return link;
  }

  var contactChannels = document.getElementById("contact-channels");

  if (contactChannels && (whatsappDigits || hasEmail)) {
    contactChannels.hidden = false;
    contactChannels.innerHTML = "";
    if (whatsappDigits) {
      contactChannels.appendChild(
        createChannel(
          "WhatsApp",
          "Atendimento direto",
          whatsappUrl(whatsappDigits, defaultWhatsAppMessage),
          true
        )
      );
    }
    if (hasEmail) {
      contactChannels.appendChild(
        createChannel("E-mail", emailAddress, emailUrl(emailAddress, "Contato pelo site da SIDAD", defaultWhatsAppMessage), false)
      );
    }
  } else if (contactChannels) {
    contactChannels.hidden = true;
  }

  var footerWhatsAppItem = document.getElementById("footer-whatsapp-item");
  var footerWhatsApp = document.getElementById("footer-whatsapp");
  var footerEmailItem = document.getElementById("footer-email-item");
  var footerEmail = document.getElementById("footer-email");

  if (whatsappDigits && footerWhatsAppItem && footerWhatsApp) {
    footerWhatsApp.href = whatsappUrl(whatsappDigits, defaultWhatsAppMessage);
    footerWhatsApp.target = "_blank";
    footerWhatsApp.rel = "noopener noreferrer";
    footerWhatsApp.setAttribute("aria-label", "WhatsApp (abre em nova aba)");
    footerWhatsAppItem.hidden = false;
  }

  if (hasEmail && footerEmailItem && footerEmail) {
    footerEmail.href = emailUrl(emailAddress, "Contato pelo site da SIDAD", defaultWhatsAppMessage);
    footerEmailItem.hidden = false;
  }

  var form = document.getElementById("contact-form");
  if (!form) {
    window.SIDAD_READY = true;
    return;
  }

  var nameInput = document.getElementById("name");
  var emailInput = document.getElementById("email");
  var companyInput = document.getElementById("company");
  var messageInput = document.getElementById("message");
  var consentInput = document.getElementById("consent");
  var honeypot = document.getElementById("website");
  var submitButton = document.getElementById("form-submit");
  var formNote = document.getElementById("form-note");
  var formStatus = document.getElementById("form-status");
  var nameError = document.getElementById("name-error");
  var emailError = document.getElementById("email-error");
  var messageError = document.getElementById("message-error");
  var consentError = document.getElementById("consent-error");
  var dialog = document.getElementById("message-dialog");
  var dialogMessage = document.getElementById("dialog-message");
  var copyButton = document.getElementById("copy-message");
  var closeDialogButton = document.getElementById("close-dialog");
  var copyStatus = document.getElementById("copy-status");
  var mode = formEndpoint ? "endpoint" : whatsappDigits ? "whatsapp" : hasEmail ? "email" : "copy";

  var modeCopy = {
    endpoint: {
      label: "Enviar mensagem",
      note: "Envio direto para a SIDAD. Seus dados são usados apenas para este atendimento."
    },
    whatsapp: {
      label: "Enviar pelo WhatsApp",
      note: "O WhatsApp será aberto com a mensagem pronta. Você confirma o envio por lá."
    },
    email: {
      label: "Enviar por e-mail",
      note: "Seu aplicativo de e-mail será aberto com a mensagem pronta."
    },
    copy: {
      label: "Preparar mensagem",
      note: "O canal oficial será ativado em breve. O botão prepara sua mensagem para envio posterior."
    }
  };

  submitButton.textContent = modeCopy[mode].label;
  formNote.textContent = modeCopy[mode].note;

  function setStatus(message, type) {
    formStatus.textContent = message;
    formStatus.classList.remove("is-error", "is-info");
    if (type) formStatus.classList.add(type);
  }

  function setError(input, errorElement, message) {
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
    errorElement.hidden = false;
  }

  function clearError(input, errorElement) {
    input.removeAttribute("aria-invalid");
    errorElement.hidden = true;
  }

  [
    [nameInput, nameError],
    [emailInput, emailError],
    [messageInput, messageError],
    [consentInput, consentError]
  ].forEach(function (pair) {
    var input = pair[0];
    var error = pair[1];
    input.addEventListener("input", function () {
      clearError(input, error);
    });
    input.addEventListener("change", function () {
      clearError(input, error);
    });
  });

  function validate() {
    var valid = true;
    var firstInvalid = null;

    clearError(nameInput, nameError);
    clearError(emailInput, emailError);
    clearError(messageInput, messageError);
    clearError(consentInput, consentError);

    if (nameInput.value.trim().length < 2) {
      setError(nameInput, nameError, "Informe seu nome.");
      if (!firstInvalid) firstInvalid = nameInput;
      valid = false;
    }

    if (!isEmail(emailInput.value.trim())) {
      setError(emailInput, emailError, "Informe um e-mail válido.");
      if (!firstInvalid) firstInvalid = emailInput;
      valid = false;
    }

    if (messageInput.value.trim().length < 10) {
      setError(messageInput, messageError, "Conte brevemente o que você precisa.");
      if (!firstInvalid) firstInvalid = messageInput;
      valid = false;
    }

    if (!consentInput.checked) {
      setError(consentInput, consentError, "É necessário concordar para continuar.");
      if (!firstInvalid) firstInvalid = consentInput;
      valid = false;
    }

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function buildMessage() {
    var lines = [
      "Nome: " + nameInput.value.trim(),
      "E-mail: " + emailInput.value.trim()
    ];
    var company = companyInput.value.trim();
    if (company) {
      lines.push("Estabelecimento: " + company);
    }
    lines.push("", "Mensagem:", messageInput.value.trim());
    return lines.join("\n");
  }

  function openDialogMessage(text) {
    if (!dialog || !dialogMessage) return;
    dialogMessage.value = text;
    if (copyStatus) {
      copyStatus.className = "form-status";
      copyStatus.textContent = "";
    }
    if (copyButton) copyButton.textContent = "Copiar mensagem";
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    if (copyButton) {
      window.setTimeout(function () {
        copyButton.focus();
      }, 60);
    }
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  if (copyButton && dialogMessage) {
    copyButton.addEventListener("click", function () {
      var text = dialogMessage.value;
      var done = function () {
        copyButton.textContent = "Copiado";
        if (copyStatus) {
          copyStatus.className = "form-status";
          copyStatus.textContent = "Mensagem copiada.";
        }
        window.setTimeout(function () {
          copyButton.textContent = "Copiar mensagem";
        }, 2000);
      };
      var fallback = function () {
        dialogMessage.focus();
        dialogMessage.select();
        try {
          document.execCommand("copy");
          done();
        } catch (error) {
          if (copyStatus) {
            copyStatus.className = "form-status is-error";
            copyStatus.textContent = "Selecione o texto e copie manualmente.";
          }
        }
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
      } else {
        fallback();
      }
    });
  }

  if (closeDialogButton) {
    closeDialogButton.addEventListener("click", closeDialog);
  }

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeDialog();
      }
    });
    dialog.addEventListener("close", function () {
      submitButton.focus();
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("", null);

    if (honeypot && honeypot.value) {
      return;
    }

    if (!validate()) {
      setStatus("Revise os campos destacados.", "is-error");
      return;
    }

    var message = buildMessage();

    if (mode === "copy") {
      openDialogMessage(message);
      setStatus("Sua mensagem está pronta para envio.", "is-info");
      return;
    }

    if (mode === "whatsapp") {
      var url = whatsappUrl(whatsappDigits, message);
      var opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = url;
      }
      setStatus("Abrindo o WhatsApp com a sua mensagem.", "is-info");
      return;
    }

    if (mode === "email") {
      window.location.href = emailUrl(emailAddress, "Contato pelo site da SIDAD", message);
      setStatus("Abrindo o seu aplicativo de e-mail.", "is-info");
      return;
    }

    var payload = new FormData();
    payload.append("name", nameInput.value.trim());
    payload.append("email", emailInput.value.trim());
    payload.append("company", companyInput.value.trim());
    payload.append("message", messageInput.value.trim());
    payload.append("consent", "true");
    payload.append("_subject", "Contato pelo site da SIDAD");

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    setStatus("Enviando...", "is-info");

    fetch(formEndpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: payload
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Falha no envio");
        }
        return response;
      })
      .then(function () {
        setStatus("Mensagem enviada. A SIDAD entrará em contato.", null);
        form.reset();
        clearError(nameInput, nameError);
        clearError(emailInput, emailError);
        clearError(messageInput, messageError);
        clearError(consentInput, consentError);
      })
      .catch(function () {
        setStatus("Não foi possível enviar agora. Tente novamente ou use um dos canais diretos.", "is-error");
      })
      .finally(function () {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
      });
  });

  window.SIDAD_READY = true;
})();
