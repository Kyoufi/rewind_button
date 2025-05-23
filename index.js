// ==UserScript==
// @name         Rewind Button for Silly Tavern
// @version      1.0
// @description  Adds a Rewind button to remove all messages after a chosen one
// @match        *://localhost:*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const REWIND_BUTTON_CLASS = 'rewind-button';

    function addRewindButtons() {
        const messages = document.querySelectorAll('.mes');

        messages.forEach((msg, index) => {
            if (msg.querySelector(`.${REWIND_BUTTON_CLASS}`)) return; // Already has button

            const btn = document.createElement('button');
            btn.innerText = '⏪ Rewind';
            btn.className = REWIND_BUTTON_CLASS;
            btn.style.marginLeft = '10px';
            btn.style.fontSize = '0.8em';
            btn.onclick = () => confirmAndRewind(index);

            const menu = msg.querySelector('.mes_buttons') || msg; // fallback if custom theme
            menu.appendChild(btn);
        });
    }

    function confirmAndRewind(index) {
        if (!confirm('Are you sure you want to rewind to this point? This will remove all messages after it.')) {
            return;
        }

        const allMessages = Array.from(document.querySelectorAll('.mes'));

        for (let i = allMessages.length - 1; i > index; i--) {
            allMessages[i].remove();
        }

        // Optional: Update internal memory or regenerate state if needed
    }

    function observeMessages() {
        const chatContainer = document.querySelector('#chat');
        if (!chatContainer) return;

        const observer = new MutationObserver(() => {
            addRewindButtons();
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true,
        });

        // Initial call
        addRewindButtons();
    }

    // Wait for page to load fully
    window.addEventListener('load', () => {
        setTimeout(observeMessages, 1000);
    });
})();
