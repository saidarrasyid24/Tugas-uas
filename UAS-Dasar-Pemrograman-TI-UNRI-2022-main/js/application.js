'use strict';

class Observable{

	constructor(){
		this.subscribers = [];
	}

	subscribe(fn) {
		this.subscribers.push(fn);
	}

	unsubscribe(fn) {
		this.subscribers = this.subscribers.filter(
			function(item){
				return item !== fn;
			}
		);
	}

	notifySubscribers() {
		for(let i = 0; i < this.subscribers.length; i++){
			this.subscribers[i]();
		}
	}

}

class Author{

	constructor(obj){
		this.updateProperties(obj);
	}

	updateProperties(obj){
		this.id = obj.id;
		this.name = obj.name;
	}

}

class Book{

	constructor(obj){
		this.updateProperties(obj);
	}

	updateProperties(obj){
		this.id = obj.id;
		this.author = obj.author;
		this.title = obj.title;
		this.isbn = obj.isbn;
	}

	static getFields(){
		return ['id', 'title', 'isbn', 'author'];
	}

}

class BooksCollection extends Observable{

	constructor(obj){
		super();
		this.books = obj.books || [];
	}

	getBook(id){
		for(let i = 0; i < this.books.length; i++){
			if(this.books[i].id === id){
				return this.books[i];
			}
		}
	}

	addBook(book){
		this.books.push(book);
		this.notifySubscribers();
	}

	deleteBook(book){
		for(let i = 0; i < this.books.length; i++){
			if(this.books[i] === book){
				this.books.splice(i, 1);
				break;
			}
		}
		this.notifySubscribers();
	}

	updateBook(obj){
		const book = this.getBook(obj.id);
		book.updateProperties(obj);
		this.notifySubscribers();
	}
}

const GreyModalElement = function() {
	const element = document.getElementById('grey-modal-background');
	return {
		show: function() {
			element.classList.remove('hidden');
		},
		hide: function() {
			element.innerHTML = "";
			element.classList.add('hidden');
		},
		appendChild: function(childElement) {
			element.appendChild(childElement);
		}
	}
}();

class BooksTable{

	constructor(obj){
		this.containerElement = obj.containerElement;
		this.fields = Book.getFields();
		this.updateProperties(obj);

		this.showCreateBookModalFn = () => {
			const createBookForm =
				new CreateBookFormForTable({}, this.booksCollection);
			createBookForm.render();

			GreyModalElement.appendChild(createBookForm.formElement);
			GreyModalElement.show();
			createBookForm.inputFieldForTitle.focus();
		};

		this.showEditBookModalFn = event => {
			const rowElement = event.target.closest('tr');
			const bookId =
				Number(rowElement.querySelector('td:first-child').textContent);

			const editBookForm =
				new EditBookFormForTable(
					{},
					this.booksCollection,
					this.booksCollection.getBook(bookId)
				);
			editBookForm.render();

			GreyModalElement.show();
			GreyModalElement.appendChild(editBookForm.formElement);
			editBookForm.inputFieldForTitle.focus();
		};

		this.buildDOMElements();
		this.render();
	}

	updateProperties(obj) {
		this.booksCollection = new BooksCollection(obj);
		this.booksCollection.subscribe(()=>{
			this.render();
		});
	}

	buildDOMElements() {
		this.tableElement = document.createElement('TABLE');

		this.tableHeaderElement = this.tableElement.createTHead();

		this.tableBodyElement = document.createElement('TBODY');
		this.tableElement.appendChild(this.tableBodyElement);

		this.buildAddBookBtn();
	}

	buildAddBookBtn(){
		this.createBookBtnElement = document.createElement('BUTTON');
		this.createBookBtnElement.textContent = "Buat Jurnal Baru";

		this.createBookBtnElement
			.addEventListener('click', this.showCreateBookModalFn);
	}

	renderHead(){
		this.tableHeaderElement.innerHTML = `
			<tr>
				${this.fields.map(item => `<th>${item}</th>`).join('')}
			</tr>
		`;
	}

	renderBody(){
		this.tableBodyElement.innerHTML = `
			${this.booksCollection.books.map(book => `
				<tr>
					<td>${book.id}</td>
					<td>${book.title}</td>
					<td>${book.isbn}</td>
					<td>${book.author.name}</td>
				</tr>
			`).join('')}
		`;

		for(let i = 0; i < this.tableBodyElement.children.length; i++){
			const rowElement = this.tableBodyElement.children[i];
			rowElement.addEventListener('click', this.showEditBookModalFn);
		}
	}

	render(){
		this.renderHead();
		this.renderBody();

		this.containerElement.innerHTML = "";
		this.containerElement.appendChild(this.tableElement);

		this.containerElement.appendChild(this.createBookBtnElement);
	}

}

class BaseFormAbstract{

	constructor(obj){
		if (new.target === BaseFormAbstract) {
			throw new TypeError("Abstract Instances Error");
		}
		this.method = obj.method || 'POST';
		this.action = obj.action || null;
		this.enctype = obj.enctype || null;

		this.buildDOMElements();
		this.updateAttributes();
	}

	buildDOMElements() {
		this.formElement = document.createElement('FORM');

		this.submitButtonElement = document.createElement('BUTTON');
		this.submitButtonElement.type = "submit";
		this.submitButtonElement.textContent = 'Submit';
	}

	updateAttributes() {
		this.formElement.method = this.method;
		this.formElement.action = this.action;
		if(this.enctype){
			this.formElement.enctype = this.enctype;
		}
	}

	submit(){
		this.formElement.submit();
	}
}

class CreateBookForm extends BaseFormAbstract{

	constructor(obj){
		super(obj);

		this.destroyFormFn = () => {
			GreyModalElement.hide();
		};

		this.submitEventFn = event => {
			event.preventDefault();
			this.submit();
		};

		this.updateFormElement();
		this.updateSubmitButtonElement();
		this.buildCancelButton();
	}

	updateFormElement() {
		this.formElement.name = "create-book";
		this.formElement.className = "modal";
	}

	updateSubmitButtonElement() {
		this.submitButtonElement.textContent = "Tambah Jurnal";
		this.submitButtonElement.classList.add('green');

		this.submitButtonElement.addEventListener('click', this.submitEventFn);
		this.submitButtonElement.addEventListener('keypress', event => {
			if(document.activeElement === event.target && event.keyCode === 27){
				this.submitEventFn(event);
			}
		});
	}

	buildCancelButton(){
		this.cancelButtonElement = document.createElement('BUTTON');
		this.cancelButtonElement.textContent = "Batal";

		this.cancelButtonElement.addEventListener('click', this.destroyFormFn);
		this.cancelButtonElement.addEventListener('keypress', event => {
			if(document.activeElement === event.target && event.keyCode === 27){
				this.destroyFormFn();
			}
		});
	}

	validate(){
		let isValid = true;

		const formFields =
			this.formElement.querySelectorAll('input[type="text"]');
		for(let i = 0; i < formFields.length; i++){

			if(formFields[i].value === ""){

				if(isValid){
					formFields[i].focus();
				}

				isValid = false;

				if(!formFields[i].classList.contains('error')){
					formFields[i].classList.add('error');
				}
			} else {

				if(formFields[i].classList.contains('error')){
					formFields[i].classList.remove('error');
				}

			}

		}
		return isValid;
	}

	render(){
		this.formElement.innerHTML = `
			<label>Title:</label>
			<input type="text" name="title" value="" tabindex="10"/>
			<label>ISBN:</label>
			<input type="text" name="isbn" value="" tabindex="20"/>
			<label>Author:</label>
			<input type="text" name="author.name" value="" tabindex="30"/>
		`;

		this.cancelButtonElement.tabIndex = 100;
		this.submitButtonElement.tabIndex = 110;

		this.formElement.appendChild(this.submitButtonElement);
		this.formElement.appendChild(this.cancelButtonElement);

		this.inputFieldForTitle =
			this.formElement.querySelector('input[name="title"]');
		this.inputFieldForAuthor =
			this.formElement.querySelector('input[name="author.name"]');
		this.inputFieldForISBN =
			this.formElement.querySelector('input[name="isbn"]');
	}
}

class CreateBookFormForTable extends CreateBookForm{

	constructor(obj, booksCollection){
		super(obj);
		this.booksCollection = booksCollection;
	}

	submit(){
		if(this.validate()){
			let book = new Book({
				id: this.booksCollection.books.length + 1,
				title: this.inputFieldForTitle.value,
				author: new Author({
					name: this.inputFieldForAuthor.value
				}),
				isbn: this.inputFieldForISBN.value
			});
			this.booksCollection.addBook(book);
			this.destroyFormFn();
		}
	}

}

class EditBookFormForTable extends CreateBookFormForTable{

	constructor(obj, booksCollection, book){
		super(obj, booksCollection);
		this.book = book;

		this.submitButtonElement.textContent = "Update Jurnal";
		this.buildInputFieldForId();
	}

	buildInputFieldForId(){
		this.inputFieldForId = document.createElement('INPUT');
		this.inputFieldForId.name = "id";
		this.formElement.appendChild(this.inputFieldForId);
	}

	bindBookToForm() {
		this.inputFieldForTitle.value = this.book.title;
		this.inputFieldForAuthor.value = this.book.author.name;
		this.inputFieldForISBN.value = this.book.isbn;
		this.inputFieldForId.value = this.book.id;
	}

	submit(){
		if(this.validate()){
			const bookProperties = {
				id: Number(this.inputFieldForId.value),
				title: this.inputFieldForTitle.value,
				author: new Author({
					name: this.inputFieldForAuthor.value
				}),
				isbn: this.inputFieldForISBN.value
			};
			this.booksCollection.updateBook(bookProperties);
			this.destroyFormFn();
		}
	}

	render(){
		super.render();
		this.bindBookToForm();
	}
}