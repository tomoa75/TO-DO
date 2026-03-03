logInBtn.addEventListener("click", async () => {

  const account = profile.options[profile.selectedIndex].text; // ime
  init(account);
 
})



//pomocne funkcije za dohvacanje podataka iz baze i azuriranje poretka
async function dohvatiAccounts(account) {
    const { data: accounts, error } = await _supabase
  .from('accounts')
  .select('id, name')
  .eq('name', account)
  .single()

  if (error) {
    console.error('Error fetching accounts:', error)
    return null
  }
  return accounts.id
}

async function dohvatiProfile(account) {
    const selectedAccountId = await dohvatiAccounts(account)
    if (!selectedAccountId) {
        console.error('No account found for the given name.')
        return null
    }
    const { data, error } = await _supabase
  .from('todo_tasks')
  .select('profile_id', { distinct: true })
  .eq('account_id', selectedAccountId)
  

  if (error) {
    console.error('Error fetching profiles:', error)
    return null
  }
    return [...new Set(data.map(u => u.profile_id))]
}
async function init(account) {
  const profileIds = await dohvatiProfile(account)
  console.log(profileIds)
}

