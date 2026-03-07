

/*
logInBtn.addEventListener("click", async () => {
  const account = profile.options[profile.selectedIndex].text; // ime
  const listaProfila = await dohvatiProfile(account);
  izbor.innerHTML = ""; // očisti postojeće opcije
  listaProfila.forEach((id,index) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `Profile ${id}`;
    if(index === 0) option.selected = true; // postavi prvu opciju kao odabranu
    izbor.appendChild(option);
  });
  
  login.classList.add("noshow");
  main.classList.remove("noshow");
  osvjeziNaslov(account);
  await povuciIzSupabase();
});
*/

logInBtn.addEventListener("click", async () => {
  const account = profile.options[profile.selectedIndex].text; // ime
  const listaProfila = await dohvatiProfile(account);
  console.log("Selected account:", account);
  console .log(await dohvatiAccounts(account));// ID
  console.log(profile.options[profile.selectedIndex].value);// ID
  console.log("Fetched profile IDs:", listaProfila);
 
  
   // Kreiraj input za PIN i gumb za potvrdu
    const loginContainer = document.querySelector(".login-container");
    loginContainer.innerHTML = ""; // očisti prethodni sadržaj
   

    // Input za PIN
    const pinInput = document.createElement("input");
    pinInput.type = "password";
    pinInput.placeholder = "Unesite PIN";
    loginContainer.appendChild(pinInput);
    

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
         listaProfila.forEach((id,index) => {
         const option = document.createElement("option");
         option.value = id;
         option.textContent = `Profile ${id}`;
         if(index === 0) option.selected = true; // postavi prvu opciju kao odabranu
         izbor.appendChild(option);
        });
          await povuciIzSupabase();
      }
        
        }
      else {
        const errorMessage = document.getElementById("nameError");
        errorMessage.textContent = "Pogrešan PIN. Pokušajte ponovno.";
      }
  
  }
  );
});

async function provjeriProfil(account, pin) {
  const { data, error } = await _supabase.rpc("provjeri_pin", {
  account_name: account,
  plain_pin: pin
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
  };

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
