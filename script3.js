function filtrirajProfile() {
  const input = document.getElementById("search-profile");
  const select = document.getElementById("profile");

  // KLJUČNO: Spremamo podatke (text i value), a ne same HTML elemente.
  // To radimo odmah pri pozivu funkcije kako bismo imali "izvornik".
  const podaci = Array.from(select.options).map((opt) => ({
    vrijednost: opt.value,
    tekst: opt.text,
  }));

  input.addEventListener("input", (e) => {
    const pismo = e.target.value.toLowerCase();

    // 1. Očisti trenutni prikaz
    select.innerHTML = "";

    // 2. Filtriraj podatke iz spremljenog niza "podaci"
    const filtrirano = podaci.filter((stavka) =>
      stavka.tekst.toLowerCase().includes(pismo),
    );

    // 3. Ponovno izgradi <option> elemente
    filtrirano.forEach((stavka) => {
      const novaOpcija = new Option(stavka.tekst, stavka.vrijednost);
      select.add(novaOpcija);
    });

    // 4. (Opcionalno) Ako želiš vizualnu povratnu informaciju kad nema rezultata
    if (filtrirano.length === 0) {
      const prazno = new Option("Nema pronađenih profila", "");
      prazno.disabled = true;
      select.add(prazno);
    }
  });
}

async function provjeriKljuc() {
  const regKeyInput = document.getElementById("reg-key");
  const verifyBtn = document.getElementById("verifyKeyBtn");
  const accountFields = document.getElementById("new-profile-container");
  const inputs = accountFields.querySelectorAll("input,button");

  verifyBtn.addEventListener("click", async () => {
    const key = regKeyInput.value.trim();
    if (!key) return alert("Unesite ključ!");

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Provjera...";

    // Pozivamo bazu da provjeri i IZBRIŠE ključ
    const { data: isValid, error } = await _supabase.rpc(
      "use_registration_key",
      { input_key: key },
    );

    if (error || !isValid) {
      alert("Ključ nije ispravan ili je već iskorišten!");
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Provjeri ključ";
      return;
    }

    // USPJEH: Otključavamo polja
    alert("Ključ prihvaćen! Sada možete kreirati profil.");

    regKeyInput.disabled = true; // Zaključaj polje za ključ jer je već obrisan
    verifyBtn.style.display = "none"; // Sakrij gumb za provjeru

    // Vizualno "prosvijetli" polja i omogući unos
    accountFields.style.opacity = "1";
    accountFields.style.pointer_events = "auto";
    inputs.forEach((el) => (el.disabled = false));

    document.getElementById("new-profile").focus(); // Autofokus na ime
  });
}
logInBtn.addEventListener("click", async () => {
  const account = profile.options[profile.selectedIndex].text; // ime
  const listaProfila = await dohvatiProfile(account);
  console.log("Selected account:", account);
  console.log(await dohvatiAccounts(account)); // ID
  console.log(profile.options[profile.selectedIndex].value); // ID
  console.log("Fetched profile IDs:", listaProfila);

  // Kreiraj input za PIN i gumb za potvrdu
  const loginContainer = document.querySelector(".login-container");
  loginContainer.innerHTML = ""; // očisti prethodni sadržaj

  // Input za PIN
  const pinInput = document.createElement("input");
  pinInput.type = "password";
  pinInput.placeholder = "Unesite PIN";
  loginContainer.appendChild(pinInput);
  pinInput.focus();

  // Gumb za spremanje PIN-a
  const checkBtn = document.createElement("button");
  checkBtn.textContent = "Provjeri PIN";
  loginContainer.appendChild(checkBtn);

  // Event listener za spremanje
  checkBtn.addEventListener("click", async () => {
    const pin = pinInput.value.trim();
    if (!pin) {
      alert("Unesite PIN!");
      return;
    }

    const isValid = await provjeriProfil(account, pin);
    console.log("PIN valid:", isValid);
    if (isValid) {
      login.classList.add("noshow");
      main.classList.remove("noshow");
      osvjeziNaslov(account);

      // Nakon uspješne provjere PIN-a, dohvatite profile i zadatke
      if (listaProfila.length > 0) {
        izbor.innerHTML = ""; // očisti postojeće opcije
        listaProfila.forEach((id, index) => {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = `Profile ${id}`;
          if (index === 0) option.selected = true; // postavi prvu opciju kao odabranu
          izbor.appendChild(option);
        });
        await povuciIzSupabase();
      }
    } else {
      const errorMessage = document.getElementById("nameError");
      errorMessage.textContent = "Pogrešan PIN. Pokušajte ponovno.";
    }
  });
});

deleteProfile.addEventListener("click", async () => {
  const account = profile.options[profile.selectedIndex].text; // ime

  console.log("Selected account for erase:", account);
  console.log(await dohvatiAccounts(account)); // ID

  // Kreiraj input za PIN i gumb za potvrdu
  const loginContainer = document.querySelector(".login-container");
  loginContainer.innerHTML = ""; // očisti prethodni sadržaj

  // Input za PIN
  const pinInput = document.createElement("input");
  pinInput.type = "password";
  pinInput.placeholder = "Unesite PIN profila za brisanje";
  loginContainer.appendChild(pinInput);
  pinInput.focus();

  // Gumb za spremanje PIN-a
  const checkBtn = document.createElement("button");
  checkBtn.textContent = "Provjeri PIN";
  loginContainer.appendChild(checkBtn);

  // Event listener za spremanje
  checkBtn.addEventListener("click", async () => {
    const pin = pinInput.value.trim();
    if (!pin) {
      alert("Unesite PIN!");
      return;
    }

    const isValid = await provjeriProfil(account, pin);
    const accountId = await dohvatiAccounts(account);
    console.log("PIN valid:", isValid);
    if (isValid) {
      const potvrda = confirm(
        `PIN ok,Dali ste sigurni da želite izbrisati profil ${account}?`,
      );
      if (potvrda) {
        console.log(`pokrecemo brisanje accounta ${account}`);
        // Brisanje samo iz glavne tablice 'accounts'
        const { error } = await _supabase
          .from("accounts")
          .delete()
          .eq("id", accountId);

        if (error) {
          console.error("Greška:", error.message);
        } else {
          alert("Sve je uspješno obrisano.");
          // Ovdje očisti session i preusmjeri korisnika
          location.reload();
        }
      } else {
        console.log("refresh page");
        location.reload();
      }

      // Nakon uspješne provjere PIN-a, brisemo profil u supabase
    } else {
      const errorMessage = document.getElementById("nameError");
      errorMessage.textContent = "Pogrešan PIN. Pokušajte ponovno.";
    }
  });
});

async function provjeriProfil(account, pin) {
  const { data, error } = await _supabase.rpc("provjeri_pin", {
    account_name: account,
    plain_pin: pin,
  });
  if (error) {
    console.error("Greška prilikom provjere PIN-a:", error);
    return;
  }

  if (data) {
    console.log("Login uspješan ✅");
    return true;
  } else {
    console.log("PIN nije točan ❌");
    return false;
  }

  // ovdje nastavljaš flow, npr. prikaz TODO liste
}

//pomocne funkcije za dohvacanje podataka iz baze i azuriranje poretka
async function dohvatiAccounts(account) {
  const { data: accounts, error } = await _supabase
    .from("accounts")
    .select("id, name")
    .eq("name", account)
    .single();

  if (error) {
    console.error("Error fetching accounts:", error);
    return null;
  }
  return accounts.id;
}

async function dohvatiProfile(account) {
  const selectedAccountId = await dohvatiAccounts(account);
  if (!selectedAccountId) {
    console.error("No account found for the given name.");
    return null;
  }
  const { data, error } = await _supabase
    .from("profiles")
    .select("*")
    .eq("account_id", selectedAccountId);

  if (error) {
    console.error("Error fetching profiles:", error);
    return null;
  }
  return [...new Set(data.map((u) => u.name))]; // vraća jedinstvene profile
}
async function init(account) {
  const profileIds = await dohvatiProfile(account);
  console.log(profileIds);
  return profileIds;
}
