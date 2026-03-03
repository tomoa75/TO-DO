// --- SUPABASE INICIJALIZACIJA ---
const { createClient } = supabase;

const _supabase = createClient(
  "https://cftphiqouyokqspxdpmz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdHBoaXFvdXlva3FzcHhkcG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODg0MTQsImV4cCI6MjA4MTU2NDQxNH0.mX07DQ3lIwsxs0NJXYdYVBCh7GnOth4zJxEDhpPDxEw",
);

// --- POMOĆNA FUNKCIJA ZA BOJU GUMBA ---
function osvjeziIzgledGumba(li) {
  const textarea = li.querySelector(".detalji");
  const infoGumb = li.querySelector(".info");
  if (textarea.value.trim() !== "") {
    infoGumb.style.backgroundColor = "red";
    infoGumb.style.color = "white";
    infoGumb.textContent = "Detalji";
  } else {
    infoGumb.style.backgroundColor = "";
    infoGumb.style.color = "";
    infoGumb.textContent = "Info";
  }
}

// --- DOM ELEMENTI ---
const login = document.querySelector(".login");
const unos = document.querySelector(".unos");
const gumbDodaj = document.querySelector(".gumb-dodaj");
const lista = document.querySelector(".lista");
const naslov = document.getElementById("naslov");
const izbor = document.getElementById("izbor");
const main = document.querySelector("main");
const profile = document.getElementById("profile");
const gumbCreateProfile = document.getElementById("create-profile-button");
const newProfileInput = document.getElementById("new-profile");
const logInBtn = document.getElementById("login-button");

// --- FUNKCIJE ---
function stvoriElementListe(tekst, obavljen) {
  const li = document.createElement("li");
  if (obavljen) li.classList.add("prekrizeno");
  li.innerHTML = `
    <button class="gore" type="button">▲</button>
    <button class="dolje" type="button">▼</button>
    <input type="checkbox" class="prekrizi" ${obavljen ? "checked" : ""} />
    <span class="tekst">${tekst}</span>
    <button class="ukloni" type="button">X</button>
    <button class="info" type="button">Info</button>
    <textarea class="detalji" placeholder="Unesite dodatne detalje..." rows="5" cols="45"></textarea>
    <button class="spremi" type="button">Spremi</button>
  `;
  lista.appendChild(li);
  return li;
}
async function odaberiProfil() {
  await povuciAccounte();
  //ovde se dovacaju profili iz baze i popunjava select element
  //nakon odabira profila, poziva se povuciIzSupabase() da se dohvate zadaci za taj profil
  main.classList.add("noshow");
}
async function kreirajProfil(naziv, pin) {
  const { data, error } = await _supabase
    .from("accounts")
    .insert({
      name: naziv,
      pin_hash: pin,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  const option = document.createElement("option");
  option.value = data.id;
  option.textContent = data.name;
  profile.appendChild(option);
}

function osvjeziNaslov(account) {
  naslov.textContent = account ? ` ${account}` : "";
}
//---POVUCI ACCOUNTE IZ SUPABASE---
async function povuciAccounte() {
  const { data, error } = await _supabase.from("accounts").select("*");
  if (error || !data) {
    console.error("Greška pri povlačenju profila:", error);
    return;
  }
  data.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = account.name;
    profile.appendChild(option);
  });
}

// --- POVUCI ZADATAKE IZ SUPABASE ---
async function povuciIzSupabase() {
  lista.innerHTML = "";

  const trenutniProfil = izbor.value;

  const { data, error } = await _supabase
    .from("todo_tasks")
    .select("*")
    .eq("profile_id", trenutniProfil)
    .order("poredak", { ascending: true });

  if (error || !data) {
    console.error("Greška pri povlačenju:", error);
    return;
  }

  data.forEach((z) => {
    const li = stvoriElementListe(z.tekst, z.obavljen);
    li.dataset.id = Number(z.id); // 👈 int8
    li.querySelector(".detalji").value = z.detalji || "";
    osvjeziIzgledGumba(li);
  });
}

async function updatePoredak() {
  const svi = Array.from(lista.querySelectorAll("li"));
  for (let i = 0; i < svi.length; i++) {
    await _supabase
      .from("todo_tasks")
      .update({ poredak: i })
      .eq("id", Number(svi[i].dataset.id));
  }
}

// --- DODAJ ZADATAK ---
gumbDodaj.addEventListener("click", async () => {
  const tekst = unos.value.trim();
  if (!tekst) return;
  const trenutniProfil = izbor.value;

  const { data, error } = await _supabase
    .from("todo_tasks")
    .insert({
      profile_id: trenutniProfil,
      tekst: tekst,
      obavljen: false,
      detalji: "",
      poredak: lista.children.length,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  const li = stvoriElementListe(data.tekst, data.obavljen);
  li.dataset.id = Number(data.id);

  unos.value = "";
});

// --- LISTA EVENTI ---
lista.addEventListener("click", async (e) => {
  const kliknut = e.target;
  const li = kliknut.closest("li");
  if (!li) return;

  // --- STRELICA GORE ---
  if (kliknut.classList.contains("gore")) {
    const onajIznad = li.previousElementSibling;
    if (!onajIznad) return;
    lista.insertBefore(li, onajIznad);

    await updatePoredak();
    return;
  }

  // --- STRELICA DOLJE ---
  if (kliknut.classList.contains("dolje")) {
    const onajIspod = li.nextElementSibling;
    if (!onajIspod) return;
    lista.insertBefore(onajIspod, li);

    await updatePoredak();
    return;
  }

  // --- UKLANJANJE ---
  if (kliknut.classList.contains("ukloni")) {
    li.remove();
    await _supabase.from("todo_tasks").delete().eq("id", Number(li.dataset.id));
  }

  // --- PREKRIŽI (CHECKBOX) ---
  if (kliknut.classList.contains("prekrizi")) {
    li.classList.toggle("prekrizeno", kliknut.checked);
    await _supabase
      .from("todo_tasks")
      .update({ obavljen: kliknut.checked })
      .eq("id", Number(li.dataset.id));
  }

  // --- INFO ---
  if (kliknut.classList.contains("info")) {
    li.querySelector(".detalji").classList.toggle("prikazi-detalje");
    li.querySelector(".spremi").classList.toggle("prikazi");
  }

  // --- SPREMI DETALJE ---
  if (kliknut.classList.contains("spremi")) {
    osvjeziIzgledGumba(li);
    li.querySelector(".detalji").classList.remove("prikazi-detalje");
    kliknut.classList.remove("prikazi");
    await _supabase
      .from("todo_tasks")
      .update({ detalji: li.querySelector(".detalji").value })
      .eq("id", Number(li.dataset.id));
  }
});

// --- SELECT CHANGE ---
izbor.addEventListener("change", async () => {
  osvjeziNaslov();
  await povuciIzSupabase();
});

// --- DOM CONTENT LOADED ---
document.addEventListener("DOMContentLoaded", async () => {
  gumbCreateProfile.addEventListener("click", () => {
    const newProfileName = document.getElementById("new-profile").value.trim();
    if (!newProfileName) return;

    // Kreiraj div za novi profil
    const container = document.querySelector("#new-profile-container");
    container.innerHTML = ""; // očisti prethodni sadržaj

    // Input za PIN
    const pinInput = document.createElement("input");
    pinInput.type = "password";
    pinInput.placeholder = "Unesite PIN";
    container.appendChild(pinInput);

    // Gumb za spremanje PIN-a
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Spremi PIN";
    container.appendChild(saveBtn);

    // Event listener za spremanje
    saveBtn.addEventListener("click", async () => {
      const pin = pinInput.value.trim();
      if (!pin) {
        alert("Unesite PIN!");
        return;
      }
      await kreirajProfil(newProfileName, pin);
      document.getElementById("new-profile").value = "";
      container.innerHTML = "";
    });
  });

  await odaberiProfil();

  await povuciIzSupabase();
  new Sortable(lista, {
    animation: 150,
    ghostClass: "ghost",
    delay: 150, // KLJUČNO za mobitel
    delayOnTouchOnly: true, // samo za touch uređaje
    touchStartThreshold: 5, // tolerancija pomaka prsta
    onEnd: async () => await updatePoredak(),
  });
});

// --- (OPCIONALNO) Supabase Realtime ---
let refreshT;

_supabase
  .channel("tasks")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "todo_tasks" },
    () => {
      clearTimeout(refreshT);
      refreshT = setTimeout(povuciIzSupabase, 300);
    },
  )
  .subscribe();
