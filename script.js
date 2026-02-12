// Ganti URL ini dengan URL Web App yang kamu dapat dari langkah B tadi
const scriptURL = 'https://script.google.com/macros/s/AKfycbzbXf6DRWYyLOhNKD0EoSJMIelKNSOOj-rGO1uD8HPL5CSFuC2fAa4wTkqoc4rQ-wvL6w/exec'; 

// --- FUNGSI NAVIGASI ---
function bukaHalaman(namaHalaman) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.halaman').forEach(el => el.style.display = 'none');
    // Munculkan halaman yang dipilih
    document.getElementById('halaman-' + namaHalaman).style.display = 'block';
}

// --- LOGIKA FORM TRANSAKSI ---
const formTransaksi = document.forms['form-transaksi'];
formTransaksi.addEventListener('submit', e => {
    e.preventDefault();
    kirimData(formTransaksi, "Transaksi Berhasil Disimpan!");
});

// --- LOGIKA FORM SISWA ---
const formSiswa = document.forms['form-siswa'];
formSiswa.addEventListener('submit', e => {
    e.preventDefault();
    kirimData(formSiswa, "Data Siswa Berhasil Disimpan!");
    // Setelah simpan, otomatis refresh tabel
    setTimeout(loadDataSiswa, 2000); 
});

// --- FUNGSI GENERIK KIRIM DATA ---
function kirimData(formElement, pesanSukses) {
    const btn = formElement.querySelector('button');
    btn.disabled = true;
    btn.innerText = "Loading...";

    fetch(scriptURL, { method: 'POST', body: new FormData(formElement)})
        .then(response => response.json())
        .then(result => {
            if(result.result === 'success') {
                alert(pesanSukses);
                formElement.reset();
            } else {
                alert("Gagal: " + result.data);
            }
            btn.disabled = false;
            btn.innerText = "Simpan";
        })
        .catch(error => console.error('Error!', error.message));
}

// --- FUNGSI BACA DATA SISWA (READ) ---
function loadDataSiswa() {
    const tbody = document.getElementById('body-tabel-siswa');
    tbody.innerHTML = "<tr><td colspan='4'>Sedang mengambil data...</td></tr>";

    // Kita pakai trik FormData untuk kirim action 'ambil_siswa'
    const formData = new FormData();
    formData.append('action', 'ambil_siswa');

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(json => {
            if (json.result === 'success') {
                tbody.innerHTML = ""; // Bersihkan loading
                const rows = json.data;
                
                if(rows.length === 0) {
                    tbody.innerHTML = "<tr><td colspan='4'>Belum ada data siswa.</td></tr>";
                    return;
                }

                rows.forEach(row => {
                    // row[0]=NIS, row[1]=Nama, row[2]=Kelas, row[3]=Jurusan
                    let tr = `<tr>
                        <td>${row[0]}</td>
                        <td>${row[1]}</td>
                        <td>${row[2]}</td>
                        <td>${row[3]}</td>
                    </tr>`;
                    tbody.innerHTML += tr;
                });
            }
        });
}