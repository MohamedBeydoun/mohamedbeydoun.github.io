var h1 = document.querySelector("h1");
var name = h1.innerHTML;
h1.innerHTML = "";
var i = 0;
typeWriter();

function typeWriter() {
    h1.innerHTML = h1.innerHTML + name.charAt(i);
    i++;

    if (i < name.length) {
        setTimeout(typeWriter, parseInt(Math.random() * 300));
    }
    if (i === name.length) {
        h1.classList.add("cursor");
    }
}