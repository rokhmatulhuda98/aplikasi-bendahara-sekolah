const scriptURL = 'https://script.google.com/macros/s/AKfycbzbXf6DRWYyLOhNKD0EoSJMIelKNSOOj-rGO1uD8HPL5CSFuC2fAa4wTkqoc4rQ-wvL6w/exec'; 

// --- 1. FUNGSI NAVIGASI ---
function bukaHalaman(namaHalaman) {
    document.querySelectorAll('.halaman').forEach(el => el.style.display = 'none');
    document.getElementById('halaman-' + namaHalaman).style.display = 'block';
    
    // Jika buka tab SPP, otomatis refresh data siswa untuk dropdown
    if (namaHalaman === 'spp' || namaHalaman === 'siswa') loadDataSiswa();
    if (namaHalaman === 'dashboard') loadDashboard();
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
    // Pastikan library jsPDF sudah terload
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- DESAIN PDF ---
    
    // Judul (Tengah)
    doc.setFontSize(18);
    doc.text("SMK CONTOH BANGSA", 105, 20, null, null, "center");
    doc.setFontSize(14);
    doc.text("BUKTI PEMBAYARAN SPP", 105, 30, null, null, "center");
    
    // Garis Pemisah
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Isi Data (Kiri)
    doc.setFontSize(12);
    doc.text(`No Invoice   : ${data.invoice_id}`, 20, 50);
    doc.text(`Tanggal      : ${data.tanggal}`, 20, 60);
    doc.text(`NIS Siswa    : ${data.nis}`, 20, 70);
    doc.text(`Nama Siswa   : ${data.nama}`, 20, 80);
    doc.text(`Pembayaran   : SPP Bulan ${data.bulan}`, 20, 90);

    // Garis Pemisah Total
    doc.line(20, 100, 190, 100);

    // Total (Kanan Bawah)
    doc.setFontSize(16);
    doc.text(`TOTAL: Rp ${parseInt(data.nominal).toLocaleString('id-ID')}`, 190, 115, null, null, "right");

    // Footer (Tengah Bawah)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("*Dokumen ini sah dan dicetak otomatis oleh sistem.", 105, 130, null, null, "center");

    // --- AKSI DOWNLOAD OTOMATIS ---
    // Nama file: Invoice-NamaSiswa.pdf
    doc.save(`Invoice-${data.nama}.pdf`);
}

// --- 6. LOGIKA DASHBOARD & GRAFIK ---
let myChartKeuangan = null;
let myChartSiswa = null;

function loadDashboard() {
    // Tampilkan loading di angka
    document.getElementById('dash-masuk').innerText = "Loading...";
    document.getElementById('dash-saldo').innerText = "Loading...";

    const formData = new FormData();
    formData.append('action', 'ambil_dashboard');

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(json => {
            if (json.result === 'success') {
                const d = json.data;

                // 1. Update Angka Kartu (Format Rupiah)
                const fmt = (num) => "Rp " + parseInt(num).toLocaleString('id-ID');
                document.getElementById('dash-masuk').innerText = fmt(d.masuk);
                document.getElementById('dash-keluar').innerText = fmt(d.keluar);
                document.getElementById('dash-saldo').innerText = fmt(d.saldo);

                // 2. Update Grafik Keuangan (Bar Chart)
                updateChartKeuangan(d.masuk, d.keluar);

                // 3. Update Grafik Siswa (Pie Chart)
                updateChartSiswa(d.siswa_lunas, d.siswa_belum);
            }
        });
}

function updateChartKeuangan(masuk, keluar) {
    const ctx = document.getElementById('chartKeuangan').getContext('2d');
    
    // Hancurkan chart lama jika ada (biar tidak numpuk/glitch)
    if (myChartKeuangan) myChartKeuangan.destroy();

    myChartKeuangan = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                label: 'Total (Rp)',
                data: [masuk, keluar],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });
}

function updateChartSiswa(lunas, belum) {
    const ctx = document.getElementById('chartSiswa').getContext('2d');

    if (myChartSiswa) myChartSiswa.destroy();

    myChartSiswa = new Chart(ctx, {
        type: 'doughnut', // Grafik Donat
        data: {
            labels: ['Lunas', 'Belum Lunas'],
            datasets: [{
                data: [lunas, belum],
                backgroundColor: ['#3498db', '#95a5a6'],
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });
}

// Panggil dashboard saat pertama kali web dibuka
document.addEventListener('DOMContentLoaded', () => {
    bukaHalaman('dashboard'); // Default buka dashboard
});