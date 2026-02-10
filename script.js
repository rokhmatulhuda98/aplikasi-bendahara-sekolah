// Ganti URL ini dengan URL Web App yang kamu dapat dari langkah B tadi
const scriptURL = 'https://script.google.com/macros/s/AKfycbzbXf6DRWYyLOhNKD0EoSJMIelKNSOOj-rGO1uD8HPL5CSFuC2fAa4wTkqoc4rQ-wvL6w/exec'; 
const form = document.forms['form-bendahara']; // Pastikan nama form di HTML sesuai

form.addEventListener('submit', e => {
  e.preventDefault();
  
  // Tampilkan loading (opsional)
  console.log("Mengirim data...");

  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => {
        console.log('Sukses!', response);
        alert("Data berhasil masuk ke Spreadsheet!");
        form.reset(); // Kosongkan form setelah kirim
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert("Gagal mengirim data.");
    });
});