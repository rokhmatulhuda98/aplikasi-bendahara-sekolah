// Ganti URL ini dengan URL Web App yang kamu dapat dari langkah B tadi
const scriptURL = 'https://script.google.com/macros/s/AKfycbzbXf6DRWYyLOhNKD0EoSJMIelKNSOOj-rGO1uD8HPL5CSFuC2fAa4wTkqoc4rQ-wvL6w/exec'; 

// --- FUNGSI NAVIGASI ---
function bukaHalaman(namaHalaman) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.halaman').forEach(el => el.style.display = 'none');
    
    // Munculkan halaman yang dipilih
    document.getElementById('halaman-' + namaHalaman).style.display = 'block';
}

// --- LOGIKA HALAMAN KEUANGAN ---
const formTransaksi = document.forms['form-transaksi'];

formTransaksi.addEventListener('submit', e => {
    e.preventDefault();
    const btn = formTransaksi.querySelector('button');
    
    setLoading(btn, true);

    fetch(scriptURL, { method: 'POST', body: new FormData(formTransaksi)})
        .then(response => response.json())
        .then(res => {
            if(res.result === 'success') {
                alert("✅ " + res.data);
                formTransaksi.reset();
            } else {
                alert("❌ Gagal: " + res.data);
            }
            setLoading(btn, false);
        })
        .catch(err => {
            console.error(err);
            alert("Error Koneksi!");
            setLoading(btn, false);
        });
});


// --- LOGIKA HALAMAN SISWA (CREATE) ---
const formSiswa = document.forms['form-siswa'];

formSiswa.addEventListener('submit', e => {
    e.preventDefault();
    const btn = formSiswa.querySelector('button');
    
    setLoading(btn, true);

    fetch(scriptURL, { method: 'POST', body: new FormData(formSiswa)})
        .then(response => response.json())
        .then(res => {
            if(res.result === 'success') {
                alert("✅ " + res.data);
                formSiswa.reset();
                loadDataSiswa(); // Otomatis refresh tabel setelah simpan
            } else {
                alert("❌ Gagal: " + res.data);
            }
            setLoading(btn, false);
        })
        .catch(err => {
            console.error(err);
            setLoading(btn, false);
        });
});


// --- LOGIKA HALAMAN SISWA (READ/LOAD DATA) ---
function loadDataSiswa() {
    const tbody = document.getElementById('body-tabel-siswa');
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Sedang mengambil data...</td></tr>";

    // Kita buat FormData manual untuk mengirim action 'ambil_siswa'
    const formData = new FormData();
    formData.append('action', 'ambil_siswa');

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(json => {
            if (json.result === 'success') {
                tbody.innerHTML = ""; // Bersihkan loading
                const rows = json.data;
                
                if(rows.length === 0) {
                    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Belum ada data siswa.</td></tr>";
                    return;
                }

                // Loop data dan masukkan ke tabel
                rows.forEach(row => {
                    // row[0]=NIS, row[1]=Nama, row[2]=Kelas, row[3]=Jurusan
                    let tr = `<tr>
                        <td>${row[0]}</td>
                        <td><strong>${row[1]}</strong></td>
                        <td>${row[2]}</td>
                        <td>${row[3]}</td>
                    </tr>`;
                    tbody.innerHTML += tr;
                });
            }
        })
        .catch(err => {
            tbody.innerHTML = "<tr><td colspan='4' style='color:red; text-align:center'>Gagal memuat data.</td></tr>";
        });
}

// Fungsi Pemanis Tombol Loading
function setLoading(button, isLoading) {
    if(isLoading) {
        button.disabled = true;
        button.dataset.textAsli = button.innerText;
        button.innerText = "Loading...";
    } else {
        button.disabled = false;
        button.innerText = button.dataset.textAsli;
    }
}