const express = require("express");

 function Date () {

    let date = new Date();

let dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };

let bookingDate=date.toLocaleDateString("ar-EG", dateOptions);

let djibLocal =bookingDate;
let fullYear= djibLocal.getFullYear();

return djibLocal;
}

module.exports=Date;