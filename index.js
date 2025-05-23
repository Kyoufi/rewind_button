(function () {
    const EXTENSION_NAME = 'Rewind Button';

    function addRewindButtonToMessage(messageElement, messageIndex) {
        const actionsMenu = messageElement.querySelector('.mes-buttons');

        if (!actionsMenu) return;

        const rewindBtn = document.createElement('div');
        rewindBtn.className = 'mes-action-button';
        rewindBtn.innerText = 'Rewind';
        rewindBtn.style.cursor = 'pointer';

        rewindBtn.addEventListener('click', () => {
            if (!confirm('Are you sure you want to delete all messages after this one?')) return;

            const messages = window.chat;
            if (messageIndex >= messages.length - 1) return;

            // Keep messages up to and including the selected one
            window.chat = messages.slice(0, messageIndex + 1);
            saveChat();
            rebuildChatUI();
        });

        actionsMenu.appendChild(rewindBtn);
    }

    function enhanceAllMessages() {
        const messages = document.querySelectorAll('.mes');

        messages.forEach((messageEl, index) => {
            // Prevent duplicates
            if (messageEl.dataset.rewindEnhanced) return;
            messageEl.dataset.rewindEnhanced = 'true';

            addRewindButtonToMessage(messageEl, index);
        });
    }

    // Mutation observer for dynamic messages
    const observer = new MutationObserver(() => {
        enhanceAllMessages();
    });

    function start() {
        const chatContainer = document.getElementById('chat');

        if (!chatContainer) {
            console.error(`[${EXTENSION_NAME}] Chat container not found`);
            return;
        }

        observer.observe(chatContainer, { childList: true, subtree: true });
        enhanceAllMessages();
        console.log(`[${EXTENSION_NAME}] Initialized`);
    }

    if (document.readyState === 'complete') {
        start();
    } else {
        window.addEventListener('load', start);
    }
})();
