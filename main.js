const container = document.querySelector('.container');
const boardNameInput = document.querySelector('.board-name');
const newBoardBtn = document.querySelector('.new_board');
const deleteBoardBtn = document.querySelector('.board-delete');
const filterInput = document.querySelector('.filter');
const filterResults = document.querySelector('.filter_results');

let boards = JSON.parse(localStorage.getItem('boards') || '[]');
let notes = JSON.parse(localStorage.getItem('notes') || '[]');

let cardTop, cardLeft;
let activeBoard;

const paletteColors  = {
    blue: { background: 'lightblue', dragBar: 'blue' },
    green: { background: 'lightgreen', dragBar: 'green' },
    orange: { background: 'lightcoral', dragBar: 'coral' },
};

// ------------------------------
// Board Management
// ------------------------------

if (boards.length === 0) {
    createBoard();
}

if (boards.length > 0) {
    activeBoard = boards.find(board => board.activeBoard) || boards[0];
    boardNameInput.value = activeBoard.boardName;
}

boardNameInput.addEventListener('change', () => {
    if (!activeBoard) return;

    const oldBoardName = activeBoard.boardName;
    const newName = boardNameInput.value.trim();

    if (newName === '') {
        boardNameInput.value = oldBoardName;
        alert('Board name cannot be empty');
        return;
    }

    // update board name
    activeBoard.boardName = newName;

    // update all notes belonging to this board
    notes.forEach(note => {
        if (note.boardName === oldBoardName) {
            note.boardName = newName;
        }
    });

    localStorage.setItem('boards', JSON.stringify(boards));
    saveNotes();
});

// Create a new board
function createBoard() {
    boards.forEach(board => board.activeBoard = false);

    const defaultBoard = `board ${boards.length + 1}`;
    boardNameInput.value = defaultBoard;

    const board = {
        boardId: Math.random(),
        boardName: defaultBoard,
        activeBoard: true
    };

    boards.push(board);
    activeBoard = board;

    localStorage.setItem('boards', JSON.stringify(boards));
    renderBoardNotes();

}

// Handle new board button
newBoardBtn.addEventListener('click', createBoard);

// Handle delete board button
deleteBoardBtn.addEventListener('click', () => {
    if (!activeBoard) return;

    boards = boards.filter(board => board !== activeBoard);
    activeBoard = boards[0] || null;

    localStorage.setItem('boards', JSON.stringify(boards));
    if (activeBoard) {
        boardNameInput.value = activeBoard.boardName;
        renderBoardNotes();
    } else {
        boardNameInput.value = '';
        container.innerHTML = '<div class="no-note"><h1>Create a new board to get started</h1></div>';
    }
});

// Search/filter boards
filterInput.addEventListener('input', () => {
    const filterText = filterInput.value.toLowerCase();
    const filteredBoard = boards.filter(board =>
        board.boardName.toLowerCase().includes(filterText)
    );

    const boardNotFound = filterText.length > 0 && filteredBoard.length === 0;
    showFilteredList(filteredBoard, boardNotFound);
});

// Show filter results
function showFilteredList(filteredBoard, boardNotFound) {
    if (boardNotFound) {
        filterResults.innerHTML = '<h3 style="padding: 10px;">Board Not Found</h3>';
        filterResults.style.transform = 'scale(1, 1)';
        return;
    }

    if (filteredBoard.length > 0) {
        filterResults.innerHTML = `<ul class="results_list"></ul>`;
        const filterList = document.querySelector('.results_list');

        filteredBoard.forEach(board => {
            const liHTML = `<li data-id="${board.boardId}">${board.boardName}</li>`;
            filterList.insertAdjacentHTML('beforeend', liHTML);
        });
    } else {
        filterResults.innerHTML = '';
    }

    filterResults.style.transform = 'scale(1, 1)';
}

filterResults.addEventListener('click', selectBoard);

// Select a board from filter list
function selectBoard(e) {
    const li = e.target.closest('li');
    if (!li) return;

    const boardId = li.dataset.id;
    activeBoard = boards.find(board => board.boardId == boardId);

    boards.forEach(board => board.activeBoard = false);
    activeBoard.activeBoard = true;

    localStorage.setItem('boards', JSON.stringify(boards));

    boardNameInput.value = activeBoard.boardName;

    filterInput.value = '';
    filterResults.style.transform = 'scale(1, 0)';

   
    renderBoardNotes();
}

// ------------------------------
// Note Management
// ------------------------------

let highestZIndex = notes.length > 0
    ? Math.max(...notes.map(note => note.zIndex || 1)) + 1
    : 1;

//render notes of active board
function renderBoardNotes() {
    container.innerHTML = '';

    const filteredBoardNotes = notes.filter(note => note.boardName === activeBoard.boardName);

    if (filteredBoardNotes.length === 0) {
        const noNoteHtml = `
            <div class="no-note">
                <h1>Double click to add a note</h1>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', noNoteHtml);
        return;
    }

    filteredBoardNotes.forEach(note => {
        displayNotes(note);
    });
}

// initial render
renderBoardNotes();

// create new note
container.addEventListener('dblclick', createNote);

function createNote(e) {
    cardTop = e.clientY + 'px';
    cardLeft = e.clientX + 'px';

    const note = {
        boardName : activeBoard.boardName,
        noteId: Math.random(),
        cardTop,
        cardLeft,
        noteTitle: '',
        noteBody: '',
        zIndex: highestZIndex++,
        cardPalette: 'green',
        noteHeight: '300px',
        noteWidth: '300px',
        date: Date.now()
    };

    notes.push(note);
    saveNotes();

    displayNotes(note);
}

function displayNotes(note) {
    const noNote = document.querySelector('.no-note');
    if (noNote) noNote.remove();

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = note.noteId;
    card.innerHTML = `
        <div class="card-header">
            <div class="drag-bar">
                <div class="palette">
                    <span class="color" data-color="blue" style="background-color: lightblue;"></span>
                    <span class="color" data-color="green" style="background-color: lightgreen;"></span>
                    <span class="color" data-color="orange" style="background-color: lightcoral;"></span>
                </div>
            </div>
            <textarea class="card-title" placeholder="Title">${note.noteTitle}</textarea>
            <p class="card-date" title="${new Date(note.date).toLocaleString()}">
                ${new Date(note.date).toLocaleDateString()}
            </p>
        </div>
        <div class="card-body">
            <textarea class="card-content" placeholder="Write your note here">${note.noteBody}</textarea>
        </div>
        <button type="button" class="card-delete">❌</button>
    `;

    card.style.height = note.noteHeight || '300px';
    card.style.width = note.noteWidth || '300px';
    card.style.top = note.cardTop;
    card.style.left = note.cardLeft;
    card.style.zIndex = note.zIndex || 1; 
    card.style.backgroundColor = paletteColors[note.cardPalette || 'green'].background;

    container.appendChild(card);

    const cardPalette = card.querySelector('.palette');
    cardPalette.addEventListener('click', (e) => changePalette(e, card, note));

    card.addEventListener('dblclick', (e) => {
        e.stopPropagation(); 
    });

    card.addEventListener('click', () => {
        highestZIndex++;
        card.style.zIndex = highestZIndex;
        note.zIndex = highestZIndex;
        saveNotes();
    });

    moveCard(card, note);
    updateNote(note);
    deleteNote(note);
    resizeNote(card, note);
}

function moveCard(card, note) {
    let newX = 0, newY = 0, startX = 0, startY = 0;

    const dragBar = card.querySelector('.drag-bar');
    dragBar.style.backgroundColor = paletteColors[note.cardPalette || 'green'].dragBar;
    dragBar.addEventListener('mousedown', mousedown);

    function mousedown(e) {
        highestZIndex++;
        card.style.zIndex = highestZIndex;
        note.zIndex = highestZIndex;
        saveNotes();

        startX = e.clientX;
        startY = e.clientY;

        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
    }

    function mousemove(e) {
        newX = startX - e.clientX;
        newY = startY - e.clientY;

        startX = e.clientX;
        startY = e.clientY;

        let newTop = card.offsetTop - newY;
        let newLeft = card.offsetLeft - newX;

        newTop = Math.max(60, Math.min(newTop, container.clientHeight - card.offsetHeight));
        newLeft = Math.max(0, Math.min(newLeft, container.clientWidth - card.offsetWidth));

        cardTop = newTop + 'px';
        cardLeft = newLeft + 'px';

        card.style.top = cardTop;
        card.style.left = cardLeft;

        note.cardTop = cardTop;
        note.cardLeft = cardLeft;

        saveNotes();
    }

    function mouseup() {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
    }
}

function updateNote(note) {
    const card = document.querySelector(`.card[data-id="${note.noteId}"]`);
    const titleField = card.querySelector('.card-title');
    const bodyField = card.querySelector('.card-content');

    titleField.addEventListener('input', () => {
        note.noteTitle = titleField.value;
        saveNotes();
    });

    bodyField.addEventListener('input', () => {
        note.noteBody = bodyField.value;
        saveNotes();
    });
}

function deleteNote(noteToDelete) {
    const card = document.querySelector(`.card[data-id="${noteToDelete.noteId}"]`);
    const deleteBtn = card.querySelector('.card-delete');

    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('Are you sure you want to delete the note?');
        if (!confirmDelete) return;

        notes = notes.filter(note => note.noteId !== noteToDelete.noteId);
        saveNotes();
        card.remove();

        // refresh empty state for active board
        const remainingNotes = notes.filter(n => n.boardName === activeBoard.boardName);
        if (remainingNotes.length === 0) {
            const noNoteHtml = `
                <div class="no-note">
                    <h1>Double click to add a note</h1>
                </div>
            `;
            container.insertAdjacentHTML('afterbegin', noNoteHtml);
        }
    });
}
 
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function changePalette(e, card, note) {
    const color = e.target.closest('.color');
    if (!color) return;

    const selectedColor = color.dataset.color;

    card.style.backgroundColor = paletteColors[selectedColor].background;
    card.querySelector('.drag-bar').style.backgroundColor = paletteColors[selectedColor].dragBar;
    note.cardPalette = selectedColor;
    saveNotes();
}

function resizeNote(card, note) {
    const resizeObserver = new ResizeObserver(entries => {
        const {height, width} = entries[0].contentRect;
        note.noteHeight = `${height}px`;
        note.noteWidth = `${width}px`;
        saveNotes();
    });

    resizeObserver.observe(card);
}
