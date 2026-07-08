
const themeBtn =
document.getElementById("themeBtn");


themeBtn.onclick=()=>{

document.body.classList.toggle("dark");


if(document.body.classList.contains("dark"))
{
themeBtn.innerHTML="☀️";
}

else
{
themeBtn.innerHTML="🌙";
}

};





let buttons=document.querySelectorAll(
".day,.food"
);


buttons.forEach(btn=>{


btn.onclick=()=>{


let group=btn.classList.contains("day")
?".day"
:".food";


document.querySelectorAll(group)
.forEach(x=>x.classList.remove("active"));


btn.classList.add("active");


}



});
