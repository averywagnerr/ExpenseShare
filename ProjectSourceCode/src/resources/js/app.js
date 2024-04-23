/*if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

// Whenever the user explicitly chooses light mode
localStorage.theme = 'light'

// Whenever the user explicitly chooses dark mode
localStorage.theme = 'dark'*/

// Function to enable dark mode
function enableDarkMode() {
    document.documentElement.classList.add('dark'); // Add the 'dark' class to the <html> element
    localStorage.setItem('darkMode', 'enabled'); // Store the user preference in localStorage
  }
  
  // Function to disable dark mode
  function disableDarkMode() {
    document.documentElement.classList.remove('dark'); // Remove the 'dark' class from the <html> element
    localStorage.setItem('darkMode', 'disabled'); // Store the user preference in localStorage
  }
  
  // Function to toggle dark mode based on user preference
  function toggleDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled'; // Check if dark mode is enabled in localStorage
    if (darkModeEnabled) {
      disableDarkMode(); // Disable dark mode if it's enabled
    } else {
      enableDarkMode(); // Enable dark mode if it's disabled
    }
  }
  

/*// Icons
const sunIcon = document.querySelector(".sun");
const moonIcon = document.querySelector(".moon");

// Theme Vars
const userTheme = localStorage.getItem("theme");
const systemTheme = window.matchMedia ("(prefers-color-scheme: dark)").matches;

// Icon Toggling
const iconToggle = () => {
    moonIcon.classList.toggle("display-none");
    sunIcon.classList.toggle("display-none");
};

// Initial Theme Check
const themeCheck = () => {
    if (userTheme === "dark" || (!userTheme && systemTheme)) { 
        document.documentElement.classList.add("dark");
        moonIcon.classList.add("display-none");
        return;
    }
    sunIcon.classList.add("display-none");
};

// Manual Theme Switch
const themeSwitch = () => {
    if (document.documentElement.classList.contains("dark")) { document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        iconToggle();
        return;
    }
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    iconToggle();
};

// call theme switch on clicking buttons
sunIcon.addEventListener("click", () => {
    themeSwitch();
});

moonIcon.addEventListener("click", () => {
    themeSwitch();
});

// invoke theme check on initial load
themeCheck();*/