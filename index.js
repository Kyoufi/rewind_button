(function () {
    const addRewindButtons = () => {
        document.querySelectorAll('.mes').forEach((messageElement) => {
            if (messageElement.querySelector('.rewind-button')) return;

            const btn = document.createElement('button');
            btn.innerText = '⏪';
            btn.className = 'rewind-button';
            btn.style.fontSize = '1em';
            btn.title = 'Rewind to this message';

            btn.onclick = () => {
                const confirmRewind = confirm('Are you sure you want to rewind to this point? This will delete all messages below this one.');
                if (!confirmRewind) return;

                const allMessages = Array.from(document.querySelectorAll('.mes'));
                const index = allMessages.indexOf(messageElement);

                if (index >= 0) {
                    for (let i = allMessages.length - 1; i > index; i--) {
                        const msg = allMessages[i];
                        msg.remove();

                        if (typeof chat !== 'undefined' && Array.isArray(chat)) {
                            chat.splice(i, 1);
                        }
                    }
                }
            };

            const buttonsWrapper = messageElement.querySelector('.mes-buttons');
            if (buttonsWrapper) {
                buttonsWrapper.appendChild(btn);
            } else {
                messageElement.appendChild(btn);
            }
        });
    };

    const observer = new MutationObserver(() => {
        addRewindButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    addRewindButtons();

    console.log('Rewind Button extension updated with dropdown integration.');
})();
