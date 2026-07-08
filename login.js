const button = document.getElementById("theme-toggle");


const kitchen=document.getElementById("kitchen");
const canteen=document.getElementById("canteen");



kitchen.onclick=()=>{

kitchen.classList.add("active");

canteen.classList.remove("active");

}



canteen.onclick=()=>{

canteen.classList.add("active");

kitchen.classList.remove("active");

}




button.onclick=()=>{


document.body.classList.toggle("dark");


button.textContent =
document.body.classList.contains("dark")
?"☀️"
:"🌙";


}