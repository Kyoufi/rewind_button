(function () {
    const addRewindButtons = () => {
        document.querySelectorAll('.mes').forEach((messageElement) => {
            if (messageElement.querySelector('.rewind-button')) return;

            const btn = document.createElement('button');
            btn.innerText = '⏪ Rewind';
            btn.className = 'rewind-button';
            btn.style.marginLeft = '10px';
            btn.style.fontSize = '0.8em';

            btn.onclick = () => {
                const confirmRewind = confirm('Are you sure you want to rewind to this point? This will delete all messages below this one.');
                if (!confirmRewind) return;

                const allMessages = Array.from(document.querySelectorAll('.mes'));
                const index = allMessages.indexOf(messageElement);

                if (index >= 0) {
                    for (let i = allMessages.length - 1; i > index; i--) {
                        const msg = allMessages[i];
                        msg.remove();

                        // If messages are also tracked in JS memory:
                        if (typeof chat !== 'undefined' && Array.isArray(chat)) {
                            chat.splice(i, 1);
                        }
                    }
                }
            };

            const messageButtons = messageElement.querySelector('.mes-buttons');
            if (messageButtons) {
                messageButtons.appendChild(btn);
            } else {
                // Fallback if .mes-buttons doesn't exist
                messageElement.appendChild(btn);
            }
        });
    };

    // Observe changes to re-add buttons on new messages
    const observer = new MutationObserver(() => {
        addRewindButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial injection
    addRewindButtons();

    console.log('Rewind Button extension loaded.');
})();
