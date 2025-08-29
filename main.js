const container = document.querySelector('.container');

let cardTop, cardLeft;

let notes = JSON.parse(localStorage.getItem('notes') || '[]');

if(notes.length === 0){
    const noNoteHtml = `
        <div class="no-note">
            <h1>Double click to add a note</h1>
        </div>
    `
    container.insertAdjacentHTML('afterbegin', noNoteHtml)
}

let highestZIndex = notes.length > 0
    ? Math.max(...notes.map(note => note.zIndex || 1)) + 1
    : 1;

notes.forEach(note => {
    displayNotes(note);
});

container.addEventListener('dblclick', createNote);

function createNote(e) {
    cardTop = e.clientY + 'px';
    cardLeft = e.clientX + 'px';

    const note = {
        noteId: Math.random(),
        cardTop,
        cardLeft,
        noteTitle: '',
        noteBody: '',
        zIndex: highestZIndex++,
        date: Date.now()
    };

    notes.push(note);
    saveNotes()

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
            <div class="drag-bar"></div>
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

    card.style.top = note.cardTop;
    card.style.left = note.cardLeft;
    card.style.zIndex = note.zIndex || 1; 
    container.appendChild(card);


    card.addEventListener('dblclick', (e) => {
        e.stopPropagation(); 
    });

    moveCard(card, note);
    updateNote(note);
    deleteNote(note);
}

function moveCard(card, note) {
    let newX = 0, newY = 0, startX = 0, startY = 0;

     const dragBar = card.querySelector('.drag-bar')
    dragBar.addEventListener('mousedown', mousedown);

    function mousedown(e) {
        highestZIndex++;
        card.style.zIndex = highestZIndex;
        note.zIndex = highestZIndex;
        saveNotes() 

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


        newTop = Math.max(0, Math.min(newTop, container.clientHeight - card.offsetHeight));
        newLeft = Math.max(0, Math.min(newLeft, container.clientWidth - card.offsetWidth));

        cardTop = newTop + 'px';
        cardLeft = newLeft + 'px';

        card.style.top = cardTop;
        card.style.left = cardLeft;

        note.cardTop = cardTop;
        note.cardLeft = cardLeft;

        saveNotes()
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
        saveNotes()
    });

    bodyField.addEventListener('input', () => {
        note.noteBody = bodyField.value;
        saveNotes()
    });
}

function deleteNote(noteToDelete) {
    const card = document.querySelector(`.card[data-id="${noteToDelete.noteId}"]`);
    const deleteBtn = card.querySelector('.card-delete');

    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('Are you sure you want to delete the note?');
        if (!confirmDelete) return;

        notes = notes.filter(note => note.noteId !== noteToDelete.noteId);
        saveNotes()
        card.remove();
    });
}
 
function saveNotes(){
    localStorage.setItem('notes', JSON.stringify(notes));
}