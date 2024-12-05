document.addEventListener('DOMContentLoaded', function() {
    const kanbanBoard = document.getElementById('kanban-board');
    const selectFolderButton = document.getElementById('select-folder');
    const listAttributeSelect = document.getElementById('list-attribute');
    const swimlaneAttributeSelect = document.getElementById('swimlane-attribute');
    let jsonData = [];

    // Function to create a new card
    function createCard(task) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.textContent = task.title;
        card.setAttribute('draggable', true);
        card.setAttribute('id', 'card-' + Math.random().toString(36).substr(2, 9));
        return card;
    }

    // Function to create a new list
    function createList(listId, listTitle, includeTitle = true) {
        const list = document.createElement('div');
        list.className = 'kanban-list';
        list.id = listId;

        if (includeTitle) {
            const title = document.createElement('div');
            title.className = 'kanban-list-title';
            title.textContent = listTitle;
            list.appendChild(title);
        }

        return list;
    }

    // Function to create a new swimlane
    function createSwimlane(swimlaneId, swimlaneTitle) {
        const swimlane = document.createElement('div');
        swimlane.className = 'kanban-swimlane';
        swimlane.id = swimlaneId;

        const title = document.createElement('div');
        title.className = 'kanban-swimlane-title';
        title.textContent = swimlaneTitle;
        swimlane.appendChild(title);

        return swimlane;
    }

    // Function to generate the board from JSON data
    function generateBoard(data, listAttribute, swimlaneAttribute) {
        kanbanBoard.innerHTML = ''; // Clear existing board
        const swimlanes = {};
        const lists = new Set();
        let firstSwimlane = true;

        // Extract swimlanes and lists from data
        data.forEach(task => {
            if (!swimlanes[task[swimlaneAttribute]]) {
                swimlanes[task[swimlaneAttribute]] = {
                    title: task[swimlaneAttribute],
                    lists: {}
                };
            }
            lists.add(task[listAttribute]);
        });

        // Create lists for each swimlane
        for (const swimlaneId in swimlanes) {
            lists.forEach(list => {
                swimlanes[swimlaneId].lists[list] = createList(`list-${list}-${swimlaneId}`, list, firstSwimlane);
            });
            firstSwimlane = false;
        }

        // Add cards to lists
        data.forEach(task => {
            const card = createCard(task);
            swimlanes[task[swimlaneAttribute]].lists[task[listAttribute]].appendChild(card);
        });

        // Append swimlanes to the board
        for (const swimlaneId in swimlanes) {
            const swimlane = createSwimlane(swimlaneId, swimlanes[swimlaneId].title);
            lists.forEach(list => {
                swimlane.appendChild(swimlanes[swimlaneId].lists[list]);
            });
            kanbanBoard.appendChild(swimlane);
            kanbanBoard.appendChild(document.createElement('div')).className = 'kanban-separator';
        }

        // Add drag and drop functionality to new cards
        addDragAndDrop();
    }

    // Function to add drag and drop functionality
    function addDragAndDrop() {
        const lanes = document.querySelectorAll('.kanban-list');
        let draggedCard = null;

        lanes.forEach(lane => {
            lane.addEventListener('dragover', function(event) {
                event.preventDefault();
            });

            lane.addEventListener('drop', function(event) {
                event.preventDefault();
                if (draggedCard) {
                    lane.appendChild(draggedCard);
                    draggedCard.style.position = 'static';
                    draggedCard.style.opacity = '1';
                    draggedCard = null;
                }
            });
        });

        const cards = document.querySelectorAll('.kanban-card');
        cards.forEach(card => {
            card.addEventListener('dragstart', function(event) {
                draggedCard = event.target;
                event.dataTransfer.setData('text', event.target.id);
                setTimeout(() => {
                    draggedCard.style.display = 'none';
                }, 0);
            });

            card.addEventListener('dragend', function(event) {
                setTimeout(() => {
                    draggedCard.style.display = 'block';
                    draggedCard.style.opacity = '1';
                    draggedCard = null;
                }, 0);
            });

            card.addEventListener('drag', function(event) {
                if (draggedCard) {
                    draggedCard.style.position = 'absolute';
                    draggedCard.style.left = event.pageX + 'px';
                    draggedCard.style.top = event.pageY + 'px';
                    draggedCard.style.opacity = '0.8';
                    draggedCard.style.display = 'block';
                }
            });
        });

        document.addEventListener('dragover', function(event) {
            if (draggedCard) {
                draggedCard.style.position = 'absolute';
                draggedCard.style.left = event.pageX + 'px';
                draggedCard.style.top = event.pageY + 'px';
            }
        });
    }

    // Function to read JSON files from a folder
    async function readFilesFromFolder() {
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        const attributes = new Set();

        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                const file = await entry.getFile();
                const content = await file.text();
                const jsonData = JSON.parse(content);
                files.push(jsonData);

                // Collect all unique attribute names
                Object.keys(jsonData).forEach(attr => attributes.add(attr));
            }
        }

        // Populate dropdown menus with attribute names
        populateDropdown(listAttributeSelect, attributes);
        populateDropdown(swimlaneAttributeSelect, attributes);

        return files;
    }

    // Function to populate dropdown menus
    function populateDropdown(dropdown, attributes) {
        dropdown.innerHTML = ''; // Clear existing options
        attributes.forEach(attr => {
            const option = document.createElement('option');
            option.value = attr;
            option.textContent = attr;
            dropdown.appendChild(option);
        });
    }

    // Event listener for the select folder button
    selectFolderButton.addEventListener('click', async function() {
        jsonData = await readFilesFromFolder();
        const listAttribute = listAttributeSelect.value;
        const swimlaneAttribute = swimlaneAttributeSelect.value;

        if (listAttribute && swimlaneAttribute) {
            generateBoard(jsonData, listAttribute, swimlaneAttribute);
        } else {
            alert('Please select both list and swimlane attributes.');
        }
    });

    // Event listeners for the dropdown menus
    listAttributeSelect.addEventListener('change', function() {
        const listAttribute = listAttributeSelect.value;
        const swimlaneAttribute = swimlaneAttributeSelect.value;

        if (listAttribute && swimlaneAttribute) {
            generateBoard(jsonData, listAttribute, swimlaneAttribute);
        }
    });

    swimlaneAttributeSelect.addEventListener('change', function() {
        const listAttribute = listAttributeSelect.value;
        const swimlaneAttribute = swimlaneAttributeSelect.value;

        if (listAttribute && swimlaneAttribute) {
            generateBoard(jsonData, listAttribute, swimlaneAttribute);
        }
    });
});