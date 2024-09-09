let verseTemplate = document.querySelector("div.template .verse-con");
let spinner = document.querySelector("div.spin");
let screenLoad = document.querySelector("div.loading-screen");
let button = document.querySelector("button#fetch");
let buttonUpdate = document.querySelector("button#update");
let buttonDelete = document.querySelector("button#delete");
let alertDiv = document.querySelector("div.alert");
let textInput = document.querySelector("textarea#text");
let answerInput = document.querySelector("select#answer");
let optionsInput = document.querySelector("input#options");
let quoteInput = document.querySelector("input#quote");
let rowInput = document.querySelector("input#row");
let modalW = document.querySelector("#exampleModal");
let modalBody = document.querySelector("div.modal-picker-body");
let modalTitle = document.querySelector("h5.modal-picker-title");
let modalInput = document.querySelector("#bible-search-modal");
let modalSearchBibleW = document.querySelector("#bibleSearchModal");
let modalSearchBibleBody = document.querySelector(
  "div.modal-bible-search-body",
);
let modalSearchBibleTitle = document.querySelector(
  "div.modal-bible-search-title",
);
let modalSearchBibleBtn = document.querySelector(
  "button#modal-bible-search-btn",
);
let modalSearchBibleInput = document.querySelector(
  "input#modal-bible-search-input",
);
let shuffleBtn = document.querySelector("button.shuffle-btn");
let picker = document.querySelector("button.picker");
const toastAlert = document.getElementById("liveToast");
let toastMsg = document.querySelector("div#liveToast div.message");
const toast = bootstrap.Toast.getOrCreateInstance(toastAlert);
let modal = new bootstrap.Modal(modalW, {});
let modalSearchBible = new bootstrap.Modal(modalSearchBibleW, {});
let cards = document.querySelectorAll("div.wrap");
let togleAll = document.querySelector("a.toggle-all");
let inputChip = document.querySelector("input#chip-entry");
inputChip.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (inputChip.value != "") {
      let div = document.createElement("div");
      let closeBtn = document.querySelector("div.close-chip-tpl");
      closeBtn = closeBtn.cloneNode(true);
      closeBtn.classList.remove("close-chip-tpl");
      closeBtn.addEventListener("click", () => {
        div.remove();
      });
      div.innerHTML = `<span class="text-truncate">${inputChip.value}</span>`;
      div.appendChild(closeBtn);
      div.classList.add("chip");
      div.classList.add("text-dark");
      div.id = "chip-" + Date.now();

      inputChip.before(div);
      inputChip.value = "";
    }
  }
});

togleAll.addEventListener("click", (event) => {
  if (event.currentTarget.innerText.toLowerCase() == "hide all") {
    toggleCards(true);
    event.currentTarget.innerText = "Show all";
  } else {
    toggleCards(false);
    event.currentTarget.innerText = "Hide all";
  }
});

modalInput.addEventListener("keyup", () => {
  let verses = modalBody.querySelectorAll("p");
  verses.forEach((verse) => {
    if (
      !verse.innerText.toLowerCase().includes(modalInput.value.toLowerCase())
    ) {
      verse.classList.add("d-none");
    } else {
      verse.classList.remove("d-none");
    }
  });
});
modalSearchBibleBtn.addEventListener("click", () => {
  let query = modalSearchBibleInput.value;
  searchBible(query, 1);
});
button.addEventListener("click", () => {
  getRow();
});
buttonUpdate.addEventListener("click", () => {
  updateRow();
});
buttonDelete.addEventListener("click", () => {
  deleteRow(rowInput.value);
});

picker.addEventListener("click", () => {
  getBibleText(quoteInput.value);
});

shuffleBtn.addEventListener("click", () => {
  shuffle();
});

optionsInput.addEventListener("keyup", () => {
  getOptions(optionsInput.value, answerInput);
});

addCopyEvent();
toggleCards(true);

function addCopyEvent() {
  let copyBtns = Array.from(
    document.querySelectorAll("div.wrap div:nth-child(1) button"),
  );
  let inputs = [rowInput, textInput, answerInput, optionsInput, quoteInput];
  for (let i = 0; i < inputs.length; i++) {
    copyBtns[i].addEventListener("click", () => {
      copyData(inputs[i].value.toString());
    });
  }
}

hideCardsEvent();

function hideCardsEvent() {
  cards.forEach((card) => {
    let label = card.querySelector("label");
    label.addEventListener("click", () => {
      let other = card.querySelectorAll(
        "div.wrap-details,div.wrap-actions,input:nth-child(n+2), textarea:nth-child(n+2), select:nth-child(n+2)",
      );
      other.forEach((oth) => {
        if (oth.classList.contains("d-none")) {
          oth.classList.remove("d-none");
        } else {
          oth.classList.add("d-none");
        }
      });
    });
  });
}

function toggleCards(hide) {
  cards.forEach((card) => {
    let other = card.querySelectorAll(
      "div.wrap-details,div.wrap-actions,input:nth-child(n+2), textarea:nth-child(n+2), select:nth-child(n+2)",
    );
    other.forEach((oth) => {
      if (!hide) {
        oth.classList.remove("d-none");
      } else {
        oth.classList.add("d-none");
      }
    });
  });
}

function searchBible(query, page) {
  screenLoad.classList.remove("d-none");
  fetch(`/bible/search?query=${query}&page=${page}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      screenLoad.classList.add("d-none");
      parseResults(data, query);
    })
    .catch((error) => {
      screenLoad.classList.add("d-none");
      showToast(error, "error");
      console.error("There was a problem with the fetch operation:", error);
    });
}
function getBibleText(quote) {
  if (quote === "") {
    showToast("Empty quote", "error");
    return;
  }
  if (!validateQuote(quote)) {
    return;
  }
  screenLoad.classList.remove("d-none");
  fetch("/bible", {
    method: "POST",
    body: JSON.stringify({ quote: quote }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((data) => {
      if (data.status != 200) {
        throw new Error(`Error parsing quote "${quote}"`);
      }
      return data.json();
    })
    .then((data) => {
      screenLoad.classList.add("d-none");
      parseVerses(data, quote);
      modal.show();
    })
    .catch((err) => {
      screenLoad.classList.add("d-none");
      showToast(err, "error");
    });
}

function updateRow() {
  let values = {
    row: rowInput.value,
    text: textInput.value,
    answer: answerInput.value,
    options: optionsInput.value,
    quote: quoteInput.value,
  };
  for (const value of Object.values(values)) {
    if (value == "") {
      showToast(`Please, Complete all fields.`, "error");
      return;
    }
  }
  if (!validateQuote(values.quote)) {
    return false;
  }
  screenLoad.classList.remove("d-none");
  fetch("/update", {
    method: "POST",
    body: JSON.stringify(values),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((data) => {
      return data.json();
    })
    .then((data) => {
      if (data.error == true) {
        throw new Error(err.msg);
      }
      screenLoad.classList.add("d-none");
      showToast("successfully updated!", "success");
    })
    .catch((err) => {
      screenLoad.classList.add("d-none");
      showToast(err, "error");
    });
}

function getRow() {
  screenLoad.classList.remove("d-none");
  fetch("/fetch")
    .then((data) => {
      // if (data.status != 200) {
      // 	throw new Error("server returned error");
      // }
      return data.json();
    })
    .then((data) => {
      if (data.error == true) {
        throw new Error(data.msg);
      }
      rowInput.value = data.row;
      textInput.value = data.text;
      getOptions(data.options, answerInput);
      quoteInput.value = data.quote;
      optionsInput.value = data.options;
      screenLoad.classList.add("d-none");
    })
    .catch((err) => {
      screenLoad.classList.add("d-none");
      showAlert(err, "alert-danger");
    });
}

function deleteRow(row) {
  if (rowInput.value == "") {
    showToast("Invalid Id value", "error");
    return;
  }
  screenLoad.classList.remove("d-none");
  fetch(`/delete/${row}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      row: row,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        throw new Error("Server responded with error.");
      }
      screenLoad.classList.add("d-none");
      showToast("Successfully deleted record", "success");
    })
    .catch((error) => {
      screenLoad.classList.add("d-none");
      showToast(error, "error");
    });
}

function getDefinition(word) {
  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      //let drillData = data[0]["meanings"][1]["definitions"][1]
      let str = "";
      for (const item of data[0]["meanings"]) {
        str += item["partOfSpeech"] + "\n________\n\t";
        //str += JSON.stringify(item)
        for (const def of item["definitions"]) {
          str +=
            "\u2022 " +
            def["definition"] +
            "\n\t" +
            "- Ex. " +
            def["example"] +
            "\n";
        }
      }
      showToast(str, "success");
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}
function getOptions(options, select) {
  select.innerHTML = "";
  for (const opt of options.split("|")) {
    let optElement = document.createElement("option");
    optElement.value = opt;
    optElement.text = opt;
    select.add(optElement);
  }
}

function showAlert(msg, category) {
  let alerts = ["alert-info", "alert-danger", "alert-success"];
  for (const alert of alerts) {
    if (alertDiv.classList.contains(alert)) {
      alertDiv.classList.remove(alert);
    }
  }
  alertDiv.classList.remove("d-none");
  alertDiv.classList.add(category);
  alertDiv.innerHTML = "";
  alertDiv.insertAdjacentHTML("afterbegin", `<p>${msg}</p>`);
  setTimeout(() => {
    alertDiv.classList.add("d-none");
  }, 3000);
}

function showToast(msg, type) {
  let icon = toastAlert.querySelector("i");
  if (type == "success") {
    icon.classList.remove("bi-exclamation-circle-fill");
    icon.classList.add("bi-check-lg");
    toastAlert.style.backgroundColor = "#d9f3d3";
    icon.style.removeProperty("color");
    icon.style.color = "#5b7555";
    toastMsg.style.color = "#5b7555";
  } else {
    icon.classList.remove("bi-check-lg");
    icon.classList.add("bi-exclamation-circle-fill");
    toastAlert.style.backgroundColor = "rgba(242,198,195,255)";
    icon.style.removeProperty("color");
    icon.style.color = "#bb1832";
    toastMsg.style.color = "#bb1832";
  }
  toastMsg.innerText = msg;
  toast.show();
}

function parseVerses(verses, quote) {
  modalBody.innerHTML = "";
  for (const verse of verses) {
    modalTitle.innerText = quote;
    let p = document.createElement("p");
    let span = document.createElement("strong");
    let spanText = document.createElement("span");
    span.innerText = verse.verse;
    span.style.marginRight = "5px";
    spanText.innerText = verse.text;
    p.appendChild(span);
    p.appendChild(spanText);
    modalBody.appendChild(p);
  }
}

function parseResults(results, query) {
  let versesCon = modalSearchBibleBody.querySelector("div.verses-wrap");
  versesCon.innerHTML = "";
  modalSearchBibleW.querySelector(".stats").innerText =
    `${results.totalMatches} results match ${query}`;
  for (const verse of results.results) {
    let verseCon = verseTemplate.cloneNode(true);
    let a = verseCon.querySelector("a");
    a.innerText = `${verse.book.long_name} ${verse.chapter}:${verse.verse}`;
    a.addEventListener("click", (evt) => {
      getBibleText(evt.currentTarget.innerText);
    });
    verseCon.querySelector("span").innerText = verse.text;
    verseCon.querySelector("b").innerText = verse.verse;
    versesCon.appendChild(verseCon);
    console.log(query);
  }
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle() {
  let options = optionsInput.value.split("|");
  let shuffled = options
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
  let shuffledOptions = shuffled.join("|");
  optionsInput.value = shuffledOptions;
  getOptions(shuffledOptions, answerInput);
}

function copyData(data) {
  navigator.clipboard.writeText(data);
}

function validateQuote(quote) {
  let pattern = /^[1-3]?\s*[a-zA-Z]+\s*\d+:\d+-?\d*$/;
  let result = pattern.exec(quote);
  if (result == null) {
    showToast("Invalid Bible address", "error");
    return false;
  }
  return true;
}
