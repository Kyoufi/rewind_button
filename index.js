(function () {
    const EXT_NAME = 'Rewind Extension';

    function waitFor(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(interval);
                    resolve(el);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    }

    function addRewindButtonToMessage(messageEl, index) {
        const menu = messageEl.querySelector('.dropdown-menu');
        if (!menu || messageEl.dataset.rewindAdded === 'true') return;

        const separator = document.createElement('hr');
        const menuItem = document.createElement('div');
        menuItem.className = 'dropdown-item';
        menuItem.textContent = '🕑 Rewind here';
        menuItem.style.cursor = 'pointer';

        menuItem.addEventListener('click', () => {
            if (!confirm('Delete all messages after this one?')) return;

            // Remove all messages after this one
            if (Array.isArray(chat) && index < chat.length) {
                chat.splice(index + 1);
                saveChat();
                printMessages();
            }
        });

        menu.appendChild(separator);
        menu.appendChild(menuItem);
        messageEl.dataset.rewindAdded = 'true';
    }

    function hookAllMessages() {
        document.querySelectorAll('.mes').forEach((messageEl, index) => {
            addRewindButtonToMessage(messageEl, index);
        });
    }

    function observeMessages() {
        const chatContainer = document.getElementById('chat');
        if (!chatContainer) return;

        const observer = new MutationObserver(hookAllMessages);
        observer.observe(chatContainer, { childList: true, subtree: true });

        hookAllMessages();
        console.log(`[${EXT_NAME}] Initialized`);
    }

    async function init() {
        try {
            await waitFor('#chat');
            observeMessages();
        } catch (err) {
            console.error(`[${EXT_NAME}] Init failed:`, err);
        }
    }

    init();
})();
