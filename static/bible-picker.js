let data;
window.onload = () => {
  getData();
};
let containers = document.querySelectorAll("div.con");
let divBooks = document.querySelectorAll("div.book");
let bookCon = document.querySelector("div.books-container");
let chapterCon = document.querySelector("div.chapters-container");
let verseCon = document.querySelector("div.verses-container");

divBooks.forEach((book) => {
  book.addEventListener("click", (event) => {
    event.preventDefault();
    getChapters(book.innerHTML.trim());
  });
});

function toggleClass(container) {
  containers.forEach((con) => {
    con.classList.remove("d-flex");
    con.classList.remove("flex-wrap");
    con.classList.add("d-none");
  });
  container.classList.remove("d-none");
  container.classList.add("d-flex");
  container.classList.add("flex-wrap");
}

function fillContainer(n, con, width, className) {
  con.innerHTML = "";
  toggleClass(con);
  let height = width;
  if (n > 100) {
    width = "40px";
    height = "40px";
    window.alert("hi");
  }
  for (let i = 1; i <= n; i++) {
    let element = document.createElement("div");
    element.style.minWidth = `${width}`;
    element.style.minHeight = `${height}`;
    element.style.textAlign = "center";
    element.innerText = i.toString();
    element.classList.add("d-flex");
    element.classList.add("border");
    element.classList.add("align-items-center");
    element.classList.add("justify-content-center");
    element.classList.add("bg-dark");
    element.classList.add("text-white");
    element.classList.add(`${className}`);
    con.appendChild(element);
  }
}

function getChapters(book) {
  let chapters = data["english"][book]["chapters"];
  fillContainer(chapters, chapterCon, "60px", "chapter");
  addCommand(book);
}

function getVerses(book, chapter) {
  let verses = data["english"][book]["verses"][chapter - 1];
  fillContainer(verses, verseCon, "40px", "verse");
  addVersesCommand(book, chapter);
}

function addCommand(book) {
  let chapters = document.querySelectorAll("div.chapter");
  chapters.forEach((chapter) => {
    chapter.addEventListener("click", () => {
      let n = parseInt(chapter.innerHTML.trim());
      getVerses(book, n);
    });
  });
}

function addVersesCommand(book, chapter) {
  let verses = document.querySelectorAll("div.verse");
  verses.forEach((verse) => {
    verse.addEventListener("click", (e) => {
      e.preventDefault();
      let verseText = verse.innerHTML.trim();
      goToQuote(book, chapter, verseText);
    });
  });
}

function getData() {
  fetch("/books")
    .then((resp) => {
      return resp.json();
    })
    .then((booksData) => {
      data = booksData;
    })
    .catch((err) => {
      console.log(err);
    });
}

function goToQuote(book, chapter, verse) {
  let quote = `${book} ${chapter}:${verse}`;
  let a = document.createElement("a");
  let url = window.location.hostname;
  window.alert(window.location.hostname);
  a.href = `bible/${quote}`;
  verseCon.appendChild(a);
  a.click();
  verseCon.removeChild(a);
}
