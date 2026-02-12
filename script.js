const scriptURL = 'https://script.google.com/macros/s/AKfycbzbXf6DRWYyLOhNKD0EoSJMIelKNSOOj-rGO1uD8HPL5CSFuC2fAa4wTkqoc4rQ-wvL6w/exec'; 

// --- 1. FUNGSI NAVIGASI ---
function bukaHalaman(namaHalaman) {
    document.querySelectorAll('.halaman').forEach(el => el.style.display = 'none');
    document.getElementById('halaman-' + namaHalaman).style.display = 'block';
    
    // Jika buka tab SPP, otomatis refresh data siswa untuk dropdown
    if (namaHalaman === 'spp' || namaHalaman === 'siswa') {
        loadDataSiswa(); 
    }
}

// --- 2. LOGIKA KEUANGAN (TRANSAKSI) ---
const formTransaksi = document.forms['form-transaksi'];
if(formTransaksi) {
    formTransaksi.addEventListener('submit', e => {
        e.preventDefault();
        kirimData(formTransaksi, "Transaksi Berhasil Disimpan!");
    });
}

// --- 3. LOGIKA SCAN AI ---
const btnScan = document.getElementById('btnScan');
const inputFile = document.getElementById('inputFile');
if(btnScan) {
    btnScan.addEventListener('click', async () => {
        if (inputFile.files.length === 0) { alert("Pilih gambar dulu!"); return; }
        
        document.getElementById('statusScan').innerText = "Sedang berpikir (AI)...";
        const file = inputFile.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            const base64String = reader.result.split(',')[1];
            const formData = new FormData();
            formData.append("imageData", base64String);

            fetch(scriptURL, { method: 'POST', body: formData })
                .then(res => res.json())
                .then(res => {
                    if(res.result === 'success') {
                        alert("AI: Rp " + res.data.nominal + "\nKet: " + res.data.keterangan);
                        document.getElementById('statusScan').innerText = "Sukses scan!";
                    } else {
                        alert("Gagal: " + res.error);
                    }
                });
        };
    });
}

// --- 4. LOGIKA SISWA (SIMPAN & BACA) ---
const formSiswa = document.forms['form-siswa'];
if(formSiswa) {
    formSiswa.addEventListener('submit', e => {
        e.preventDefault();
        kirimData(formSiswa, "Siswa Berhasil Disimpan!");
    });
}

function loadDataSiswa() {
    const tbody = document.getElementById('body-tabel-siswa');
    const dropdown = document.getElementById('pilih-siswa');
    
    const formData = new FormData();
    formData.append('action', 'ambil_siswa');

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(json => {
            if (json.result === 'success') {
                const rows = json.data;
                // Update Tabel
                tbody.innerHTML = "";
                // Update Dropdown SPP
                if(dropdown) dropdown.innerHTML = '<option value="">-- Pilih Siswa --</option>';

                if(rows.length === 0) {
                    tbody.innerHTML = "<tr><td colspan='4'>Data kosong.</td></tr>";
                    return;
                }

                rows.forEach(row => {
                    // Isi Tabel
                    let tr = `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[4]}</td></tr>`;
                    tbody.innerHTML += tr;

                    // Isi Dropdown (Hanya jika dropdown ada di halaman)
                    if(dropdown) {
                        let opt = document.createElement('option');
                        opt.value = row[0] + '|' + row[1]; // Value = NIS|Nama
                        opt.text = row[0] + ' - ' + row[1];
                        dropdown.appendChild(opt);
                    }
                });
            }
        });
}

// --- 5. LOGIKA BAYAR SPP ---
const formSpp = document.forms['form-spp'];
const dropdownSiswa = document.getElementById('pilih-siswa');

// Saat dropdown dipilih, isi hidden input
if(dropdownSiswa) {
    dropdownSiswa.addEventListener('change', function() {
        if(this.value) {
            const val = this.value.split('|');
            document.getElementById('spp-nis').value = val[0];
            document.getElementById('spp-nama').value = val[1];
        }
    });
}

if(formSpp) {
    formSpp.addEventListener('submit', e => {
        e.preventDefault();
        if(!document.getElementById('spp-nis').value) { alert("Pilih siswa!"); return; }

        const btn = formSpp.querySelector('button');
        btn.innerText = "Memproses..."; btn.disabled = true;

        fetch(scriptURL, { method: 'POST', body: new FormData(formSpp)})
            .then(res => res.json())
            .then(res => {
                btn.innerText = "Bayar & Cetak"; btn.disabled = false;
                if(res.result === 'success') {
                    cetakInvoice(res.data);
                    formSpp.reset();
                } else {
                    alert("Gagal: " + res.data);
                }
            });
    });
}

// --- FUNGSI GENERIK ---
function kirimData(formEl, pesan) {
    const btn = formEl.querySelector('button');
    const txtAwal = btn.innerText;
    btn.innerText = "Loading..."; btn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: new FormData(formEl)})
        .then(res => res.json())
        .then(res => {
            btn.innerText = txtAwal; btn.disabled = false;
            if(res.result === 'success') {
                alert(pesan);
                formEl.reset();
                if(formEl.name === 'form-siswa') loadDataSiswa();
            } else {
                alert("Gagal: " + res.data);
            }
        });
}

function cetakInvoice(data) {
    var win = window.open('', '', 'height=500,width=800');
    var html = `
        <html><body style="font-family: monospace; padding: 20px;">
            <center><h2>BUKTI BAYAR SPP</h2><hr></center>
            <p>No Invoice: ${data.invoice_id}</p>
            <p>Tanggal: ${data.tanggal}</p>
            <p>Siswa: ${data.nama} (${data.nis})</p>
            <p>Pembayaran: SPP Bulan ${data.bulan}</p>
            <h3 style="text-align:right; border-top:1px dashed #000; padding-top:10px;">
                TOTAL: Rp ${parseInt(data.nominal).toLocaleString('id-ID')}
            </h3>
            <script>window.print();</script>
        </body></html>`;
    win.document.write(html);
}