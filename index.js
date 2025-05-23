// ==UserScript==
// @name         SillyTavern Rewind Extension
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds a rewind button to message quick actions in SillyTavern to delete subsequent messages.
// @author       YourName
// @match        */* (Adjust if you know the specific SillyTavern URL pattern)
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    // Adjust these selectors if SillyTavern's structure is different.
    // This is a common selector for individual chat messages.
    const MESSAGE_SELECTOR = '.mes';
    // This selector should target the container of the "..." quick actions menu for a message.
    // It might be inside the MESSAGE_SELECTOR element.
    const QUICK_ACTIONS_MENU_SELECTOR = '.message-tools .dropdown-menu'; // Example, adjust as needed
    const MORE_ACTIONS_BUTTON_SELECTOR = '.message-tools .fa-ellipsis-h'; // Example for the "..." button

    // --- Modal for Confirmation ---
    let confirmationModal = null;
    let modalResolve = null;

    function createConfirmationModal() {
        if (document.getElementById('rewind-confirmation-modal')) {
            return document.getElementById('rewind-confirmation-modal');
        }

        const modal = document.createElement('div');
        modal.id = 'rewind-confirmation-modal';
        modal.style.display = 'none'; // Hidden by default
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'; // Tailwind classes for styling

        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-white">
                <h3 class="text-lg font-semibold mb-4">Confirm Rewind</h3>
                <p class="mb-6">Are you sure you want to remove all messages below this point? This action cannot be undone directly.</p>
                <div class="flex justify-end space-x-3">
                    <button id="rewind-cancel" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium">Cancel</button>
                    <button id="rewind-confirm" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md text-sm font-medium">Confirm Rewind</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#rewind-confirm').addEventListener('click', () => {
            if (modalResolve) modalResolve(true);
            modal.style.display = 'none';
        });

        modal.querySelector('#rewind-cancel').addEventListener('click', () => {
            if (modalResolve) modalResolve(false);
            modal.style.display = 'none';
        });
        return modal;
    }

    async function showConfirmationDialog() {
        if (!confirmationModal) {
            confirmationModal = createConfirmationModal();
        }
        confirmationModal.style.display = 'flex';
        return new Promise(resolve => {
            modalResolve = resolve;
        });
    }

    // --- Rewind Logic ---
    async function rewindMessages(targetMessageElement) {
        console.log('[RewindExtension] Rewind initiated for message:', targetMessageElement);

        const confirmed = await showConfirmationDialog();
        if (!confirmed) {
            console.log('[RewindExtension] Rewind cancelled by user.');
            return;
        }

        console.log('[RewindExtension] Rewind confirmed.');

        let currentElement = targetMessageElement.nextElementSibling;
        const messagesToRemove = [];

        // Collect all subsequent sibling messages
        while (currentElement) {
            // Ensure we are only targeting message elements if there are other siblings
            if (currentElement.matches(MESSAGE_SELECTOR)) {
                messagesToRemove.push(currentElement);
            }
            currentElement = currentElement.nextElementSibling;
        }

        if (messagesToRemove.length === 0) {
            console.log('[RewindExtension] No messages found below the target message.');
            // You might want to show a notification to the user here.
            const noMessagesModal = document.createElement('div');
            noMessagesModal.className = 'fixed top-5 right-5 bg-blue-500 text-white p-3 rounded-lg shadow-md z-50';
            noMessagesModal.textContent = 'No messages below to rewind.';
            document.body.appendChild(noMessagesModal);
            setTimeout(() => {
                noMessagesModal.remove();
            }, 3000);
            return;
        }

        console.log(`[RewindExtension] Found ${messagesToRemove.length} messages to remove.`);

        // Remove messages from the DOM
        messagesToRemove.forEach(msg => {
            console.log('[RewindExtension] Removing message:', msg);
            msg.remove();
        });

        // IMPORTANT: SillyTavern specific chat update
        // After removing messages from the DOM, you VERY LIKELY need to update
        // SillyTavern's internal chat history array.
        // This usually involves finding the index of `targetMessageElement` in an array
        // like `chat` or `main_chat` and then splicing the array.
        // For example (this is PSEUDOCODE, you'll need to find the actual variables/functions):
        /*
        if (typeof chat !== 'undefined' && Array.isArray(chat)) {
            const messageId = targetMessageElement.dataset.messageId; // Assuming messages have a data-message-id
            let targetIndex = -1;
            // Find the index based on a unique ID or by comparing the element itself if objects are stored.
            // This part is highly dependent on how SillyTavern stores its chat messages.
            // Let's assume `chat` stores objects that might have an `element` property or an `id`.
            // A more robust way is to find the message index based on its swipe_id or some other unique identifier.
            // For simplicity, if SillyTavern's `chat` array directly corresponds to DOM elements order:
            const allMessages = Array.from(targetMessageElement.parentElement.querySelectorAll(MESSAGE_SELECTOR));
            const targetDomIndex = allMessages.indexOf(targetMessageElement);

            if (targetDomIndex !== -1 && targetDomIndex < chat.length) {
                 // Remove all messages from the chat array after the target message's index
                 chat.splice(targetDomIndex + 1);
                 console.log('[RewindExtension] Spliced internal chat array.');

                 // You might need to trigger a save or UI update
                 // if (typeof saveChat === 'function') saveChat();
                 // if (typeof updateChat === 'function') updateChat(); // Or similar function to refresh UI if needed
            } else {
                console.warn('[RewindExtension] Could not find target message in internal chat array or index out of bounds.');
            }
        } else {
            console.warn('[RewindExtension] Internal chat array (e.g., `chat`) not found or not an array. DOM was modified, but internal state might be inconsistent.');
        }
        */
        // The above block is crucial. Without updating the internal chat representation,
        // SillyTavern might behave unexpectedly or re-add the messages on next interaction.
        // You'll need to investigate how SillyTavern manages its chat data.
        // Common variables are `chat`, `main_chat`, `get_chat_massages()`, etc.

        console.log('[RewindExtension] Rewind complete. DOM updated.');

        // Show a success message
        const successModal = document.createElement('div');
        successModal.className = 'fixed top-5 right-5 bg-green-500 text-white p-3 rounded-lg shadow-md z-50';
        successModal.textContent = 'Rewind successful!';
        document.body.appendChild(successModal);
        setTimeout(() => {
            successModal.remove();
        }, 3000);
    }

    // --- Add Rewind Button to Message Actions ---
    function addRewindButton(messageElement) {
        // Find the "..." button or the menu it reveals
        // This part is highly dependent on SillyTavern's DOM structure.
        // We're looking for the dropdown menu that appears when you click "..."
        let menu = messageElement.querySelector(QUICK_ACTIONS_MENU_SELECTOR);

        // If the menu doesn't exist directly, it might be generated upon clicking the "..." button.
        // This script assumes the menu is either present or will be populated.
        // A more robust solution would be to also observe clicks on MORE_ACTIONS_BUTTON_SELECTOR
        // and then add the button, but that adds complexity.

        if (!menu) {
            // Attempt to find a "..." button and assume the menu is its sibling or child container
            const moreButton = messageElement.querySelector(MORE_ACTIONS_BUTTON_SELECTOR);
            if (moreButton) {
                // This is a guess. The menu might be a sibling, or a child of a sibling.
                // You might need to inspect SillyTavern's DOM to find the exact relationship.
                let potentialMenu = moreButton.closest('.message-tools')?.querySelector('.dropdown-menu');
                if (potentialMenu) {
                    menu = potentialMenu;
                } else {
                     // Fallback: create a simple container if one isn't found easily.
                     // This is less ideal as it might not match ST styling perfectly.
                    const toolsContainer = messageElement.querySelector('.message-tools');
                    if (toolsContainer) {
                        menu = document.createElement('div');
                        menu.className = 'dropdown-menu absolute bg-gray-700 rounded-md shadow-lg py-1 z-20'; // Basic styling
                        // Position it near the "..." button - this needs refinement
                        menu.style.top = '100%';
                        menu.style.right = '0';
                        menu.style.display = 'none'; // Hidden initially
                        toolsContainer.style.position = 'relative'; // For absolute positioning of menu
                        toolsContainer.appendChild(menu);

                        // Show/hide logic for this created menu
                        moreButton.addEventListener('click', (event) => {
                            event.stopPropagation();
                            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                        });
                        document.addEventListener('click', (e) => {
                            if (!toolsContainer.contains(e.target)) {
                                menu.style.display = 'none';
                            }
                        });
                    }
                }
            }
        }


        if (menu) {
            // Check if button already exists
            if (menu.querySelector('.rewind-button')) {
                return;
            }

            const rewindButton = document.createElement('button');
            rewindButton.innerHTML = '<i class="fas fa-history"></i> Rewind'; // Using Font Awesome icon, ensure it's available
            rewindButton.className = 'rewind-button block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white rounded-md'; // Tailwind classes
            rewindButton.style.cursor = 'pointer';

            rewindButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent menu from closing if it's a dropdown
                rewindMessages(messageElement);
                // Hide the menu after action
                if (menu.style.display !== 'none' && menu.closest('.dropdown-menu')) { // Check if it's part of a dropdown
                     menu.style.display = 'none';
                } else if (menu.style.display !== 'none') { // Generic hide for custom created menu
                     menu.style.display = 'none';
                }
            });

            // Add a separator if there are other items
            if (menu.children.length > 0) {
                const separator = document.createElement('div');
                separator.className = 'my-1 h-px bg-gray-600'; // Tailwind for separator
                menu.appendChild(separator);
            }
            menu.appendChild(rewindButton);
            // console.log('[RewindExtension] Rewind button added to:', messageElement);

        } else {
            // console.warn('[RewindExtension] Quick actions menu not found for message:', messageElement, 'Selector used:', QUICK_ACTIONS_MENU_SELECTOR);
        }
    }

    // --- Observe DOM for new messages ---
    // This is crucial for applying the button to dynamically loaded messages.
    function observeMessages() {
        const chatContainer = document.body; // Observe the whole body or a more specific chat container if known
                                          // e.g., document.getElementById('chat') or document.querySelector('.chat-container')

        if (!chatContainer) {
            console.error('[RewindExtension] Chat container not found. Extension cannot run.');
            return;
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If the added node is a message itself
                        if (node.matches(MESSAGE_SELECTOR)) {
                            addRewindButton(node);
                        }
                        // If messages are added in a batch, or if the node contains messages
                        node.querySelectorAll(MESSAGE_SELECTOR).forEach(addRewindButton);

                        // Special handling if the "..." menu itself is added dynamically after message load
                        // This is for cases where the menu structure is complex and added later.
                        if (node.matches(MORE_ACTIONS_BUTTON_SELECTOR) || node.querySelector(MORE_ACTIONS_BUTTON_SELECTOR)) {
                            const messageElement = node.closest(MESSAGE_SELECTOR);
                            if (messageElement && !messageElement.querySelector('.rewind-button')) {
                                addRewindButton(messageElement);
                            }
                        }
                        if (node.matches(QUICK_ACTIONS_MENU_SELECTOR) || node.querySelector(QUICK_ACTIONS_MENU_SELECTOR)) {
                            const messageElement = node.closest(MESSAGE_SELECTOR);
                            if (messageElement && !messageElement.querySelector('.rewind-button')) {
                                addRewindButton(messageElement);
                            }
                        }
                    }
                });
            });
        });

        observer.observe(chatContainer, { childList: true, subtree: true });
        console.log('[RewindExtension] Observing for new messages.');

        // Also process existing messages on load
        document.querySelectorAll(MESSAGE_SELECTOR).forEach(addRewindButton);
    }

    // --- Initialization ---
    // Wait for the DOM to be fully loaded before trying to find elements.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            confirmationModal = createConfirmationModal(); // Pre-create modal
            observeMessages();
        });
    } else {
        confirmationModal = createConfirmationModal(); // Pre-create modal
        observeMessages();
    }

    console.log('[RewindExtension] Loaded successfully.');

})();
