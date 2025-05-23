// --- CONFIGURATION: These selectors MUST be updated ---
// You'll need to inspect Silly Tavern's HTML to find the right ones.
const MESSAGE_CONTAINER_SELECTOR = '#chat'; // The main container holding all messages
const MESSAGE_SELECTOR = '.message-class'; // Selector for an individual message bubble/container
const MORE_ACTIONS_BUTTON_SELECTOR = '.message-actions .options-button'; // The '...' button itself
const ACTIONS_MENU_SELECTOR = '.message-options-dropdown'; // The menu that appears after '...' is clicked
// --- END CONFIGURATION ---

function addRewindFunctionalityToMessage(messageElement) {
    const moreActionsButton = messageElement.querySelector(MORE_ACTIONS_BUTTON_SELECTOR);

    if (moreActionsButton && !messageElement.dataset.rewindButtonAdded) {
        moreActionsButton.addEventListener('click', () => {
            // The actions menu might be dynamically created/populated.
            // We need to wait for it to appear before adding our button.
            // A robust way is MutationObserver, a simpler way is setTimeout.
            setTimeout(() => {
                // Try to find the menu. It might be a global one, or specific to the message.
                // This selector might need to be very specific, or you might need to navigate from moreActionsButton.
                const actionsMenu = document.querySelector(ACTIONS_MENU_SELECTOR); // Or messageElement.querySelector(...)

                if (actionsMenu && !actionsMenu.querySelector('.st-rewind-button')) {
                    const rewindButtonListItem = document.createElement('li'); // Assuming it's a list menu
                    const rewindButton = document.createElement('button');
                    rewindButton.textContent = 'Rewind from here';
                    rewindButton.classList.add('st-rewind-button'); // For styling and identification

                    rewindButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent menu from closing or other side effects
                        event.preventDefault();

                        if (confirm('Are you sure? All messages below this one will be permanently removed from view.')) {
                            let currentMessage = messageElement;
                            let nextSibling = currentMessage.nextElementSibling;

                            while (nextSibling) {
                                // Important: Only remove actual messages if other elements might be siblings.
                                // If all siblings are messages, this check can be simpler.
                                if (nextSibling.matches(MESSAGE_SELECTOR)) {
                                    const toRemove = nextSibling;
                                    nextSibling = nextSibling.nextElementSibling;
                                    toRemove.remove();
                                } else {
                                    nextSibling = nextSibling.nextElementSibling; // Skip non-message siblings
                                }
                            }

                            // Optionally, try to close the actions menu
                            // This depends on how ST's menu works.
                            // e.g., actionsMenu.style.display = 'none'; or actionsMenu.classList.remove('active');
                            // Or if it's a component, it might have a hide() method.
                            // For now, the user can click away to close it.
                        }
                    });

                    rewindButtonListItem.appendChild(rewindButton);
                    actionsMenu.appendChild(rewindButtonListItem);
                }
            }, 100); // Adjust delay as needed, or implement MutationObserver for the menu
        });
        messageElement.dataset.rewindButtonAdded = 'true'; // Mark so we don't add multiple listeners
    }
}

// Process existing messages on page load
function initialScan() {
    document.querySelectorAll(MESSAGE_SELECTOR).forEach(addRewindFunctionalityToMessage);
}

// Use MutationObserver to detect new messages being added to the chat
function observeNewMessages() {
    const chatContainer = document.querySelector(MESSAGE_CONTAINER_SELECTOR);
    if (!chatContainer) {
        console.warn('Silly Tavern Rewind: Chat container not found. New messages might not get the rewind button.');
        return;
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If the added node is a message itself
                        if (node.matches(MESSAGE_SELECTOR)) {
                            addRewindFunctionalityToMessage(node);
                        }
                        // If messages are added inside another container
                        node.querySelectorAll(MESSAGE_SELECTOR).forEach(addRewindFunctionalityToMessage);
                    }
});
            }
        }
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
}

// Start the process
initialScan();
observeNewMessages();
