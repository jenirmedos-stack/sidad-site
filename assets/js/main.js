(function () {
  "use strict";

  var config = window.SIDAD_CONFIG || {};
  var header = document.querySelector(".site-header");
  var navGlass = document.querySelector("[data-glass]");
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var pageNavLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link, .mobile-nav-list a"));

  function normalizePath(value) {
    var result = String(value || "").split("#")[0];
    if (result.length > 1 && result.slice(-1) === "/") result = result.slice(0, -1);
    if (result.slice(-11) === "/index.html") result = result.slice(0, -11);
    return result || "/";
  }

  var currentPath = normalizePath(window.location.pathname);
  pageNavLinks.forEach(function (link) {
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) !== "/") return;
    var target = normalizePath(href);
    var active = target === "/" ? currentPath === "/" : currentPath === target || currentPath.indexOf(target + "/") === 0;
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktopQuery = window.matchMedia("(min-width: 900px)");
  var finePointer = window.matchMedia("(pointer: fine)");
  var processUpdate = null;
  var parallaxItems = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;

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

  var progressBar = document.getElementById("scroll-progress-bar");

  function updateProgress() {
    if (!progressBar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = "scaleX(" + ratio + ")";
  }

  function updateParallax() {
    if (reduceMotion || !desktopQuery.matches) return;

    var viewport = window.innerHeight;

    parallaxItems.forEach(function (element) {
      var rect = element.getBoundingClientRect();
      if (rect.bottom < -180 || rect.top > viewport + 180) return;

      var speed = parseFloat(element.getAttribute("data-speed")) || 0.28;
      var offset = (rect.top + rect.height / 2 - viewport / 2) * speed * -0.06;
      offset = Math.max(-26, Math.min(26, offset));
      element.style.setProperty("--parallax-x", "0px");
      element.style.setProperty("--parallax-y", offset.toFixed(2) + "px");
    });
  }

  function updateOnScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    updateProgress();
    updateParallax();
    if (processUpdate) processUpdate();


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

  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  if (navGlass && finePointer.matches && !reduceMotion) {
    navGlass.addEventListener("pointermove", function (event) {
      var rect = navGlass.getBoundingClientRect();
      navGlass.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width) * 100 + "%");
      navGlass.style.setProperty("--my", ((event.clientY - rect.top) / rect.height) * 100 + "%");
    });

    navGlass.addEventListener("pointerleave", function () {
      navGlass.style.setProperty("--mx", "30%");
      navGlass.style.setProperty("--my", "20%");
    });
  }

  var hero = document.querySelector(".hero");
  var heroMedia = document.querySelector(".hero-media");

  if (hero && heroMedia && finePointer.matches && !reduceMotion) {
    hero.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      var y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      heroMedia.style.setProperty("--hero-x", x.toFixed(2) + "px");
      heroMedia.style.setProperty("--hero-y", y.toFixed(2) + "px");
    });

    hero.addEventListener("pointerleave", function () {
      heroMedia.style.setProperty("--hero-x", "0px");
      heroMedia.style.setProperty("--hero-y", "0px");
    });
  }

  if (finePointer.matches && desktopQuery.matches && !reduceMotion) {
    var cursorDot = document.createElement("div");
    cursorDot.className = "cursor-dot";
    cursorDot.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursorDot);

    var interactiveSelector = "a, button, input, textarea, select, label, [role='button']";

    function isInteractive(target) {
      return !!(target && target.closest && target.closest(interactiveSelector));
    }

    document.addEventListener(
      "pointermove",
      function (event) {
        if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
        cursorDot.style.setProperty("--cx", event.clientX + "px");
        cursorDot.style.setProperty("--cy", event.clientY + "px");
        cursorDot.classList.add("is-visible");
      },
      { passive: true }
    );

    document.addEventListener("pointerover", function (event) {
      cursorDot.classList.toggle("is-active", isInteractive(event.target));
    });

    document.addEventListener("pointerout", function (event) {
      if (!isInteractive(event.relatedTarget)) {
        cursorDot.classList.remove("is-active");
      }
    });

    document.addEventListener("mouseleave", function () {
      cursorDot.classList.remove("is-visible", "is-active");
    });
  }

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
      }, 80);
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

  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal, .reveal-img"));

  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (element) {
        element.classList.add("is-visible");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -7% 0px" }
      );

      reveals.forEach(function (element) {
        revealObserver.observe(element);
      });
    }
  }

  var process = document.querySelector("[data-process]");

  if (process) {
    var steps = Array.prototype.slice.call(process.querySelectorAll("[data-step]"));
    var progressFill = process.querySelector(".process-line span");

    processUpdate = function () {
      if (!steps.length) return;

      var focusY = window.innerHeight * 0.5;
      var bestIndex = 0;
      var bestDistance = Infinity;

      steps.forEach(function (step, index) {
        var rect = step.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var distance = Math.abs(center - focusY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      steps.forEach(function (step, index) {
        step.classList.toggle("is-active", index === bestIndex);
      });

      if (progressFill) {
        progressFill.style.height = String(((bestIndex + 1) / steps.length) * 100) + "%";
      }
    };
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
  var isSubmitting = false;
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

    if (isSubmitting) {
      return;
    }

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

    var company = companyInput.value.trim();
    var subject = "Contato pelo site da SIDAD";
    if (company) {
      subject += " — " + company;
    }

    var payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      company: company,
      subject: subject,
      message: messageInput.value.trim(),
      consent: "true",
      _subject: subject,
      _gotcha: honeypot ? honeypot.value : ""
    };

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    var originalLabel = submitButton.textContent;
    submitButton.textContent = "Enviando...";
    setStatus("Enviando solicitação...", "is-info");

    fetch(formEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!response.ok || !data || data.ok !== true) {
              throw new Error(
                "Não foi possível enviar agora. Verifique os dados e tente novamente."
              );
            }
            return data;
          });
      })
      .then(function () {
        setStatus("Solicitação enviada. A SIDAD entrará em contato.", null);
        form.reset();
        clearError(nameInput, nameError);
        clearError(emailInput, emailError);
        clearError(messageInput, messageError);
        clearError(consentInput, consentError);
      })
      .catch(function () {
        setStatus(
          "Não foi possível enviar agora. Tente novamente em instantes.",
          "is-error"
        );
      })
      .finally(function () {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = originalLabel;
      });
  });

  window.SIDAD_READY = true;
})();
