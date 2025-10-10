document.addEventListener('DOMContentLoaded', () => {
    // 1. OBTENER PARÁMETROS DE LA URL (Nombre del curso)
    const urlParams = new URLSearchParams(window.location.search);
    let courseName = urlParams.get('name');

    // Limpiar el nombre del curso para mostrarlo
    if (courseName) {
        // Reemplazar '%20' por espacios y decodificar caracteres especiales
        courseName = decodeURIComponent(courseName.replace(/\+/g, ' '));
    } else {
        // Valor por defecto si no se encuentra el parámetro
        courseName = "Curso No Seleccionado";
    }

    // 2. ACTUALIZAR EL TÍTULO DE LA PÁGINA
    const courseTitleElement = document.getElementById('course-title');
    courseTitleElement.textContent = courseName;
    document.title = `Curso: ${courseName} - OMAR`;

    // 3. GENERAR LAS 16 TARJETAS DE SEMANA
    const weeksContainer = document.getElementById('weeks-container');
    const totalWeeks = 16; 

    for (let i = 1; i <= totalWeeks; i++) {
        const weekNumber = i;
        // Importante: La semana se nombra "Semana 1", "Semana 2", etc.
        const weekTitle = `Semana ${weekNumber}`; 
        
        // Crear la estructura de la tarjeta
        const col = document.createElement('div');
        // Usamos col-6 para móviles, col-4 para tablet y col-3 para desktop
        col.className = 'col-6 col-md-4 col-lg-3'; 
        
        const card = document.createElement('div');
        card.className = 'week-card';
        card.setAttribute('data-course', courseName);
        card.setAttribute('data-week', weekTitle);

        // Contenido de la tarjeta
        card.innerHTML = `
            <div class="week-number">${weekNumber}</div>
            <div class="week-label">${weekTitle}</div>
        `;

        // 4. DEFINIR LA REDIRECCIÓN AL HACER CLICK
        card.addEventListener('click', () => {
            const selectedCourse = card.getAttribute('data-course');
            const selectedWeek = card.getAttribute('data-week');
            
            // Codificar el nombre del curso y la semana para la URL
            const encodedCourse = encodeURIComponent(selectedCourse);
            const encodedWeek = encodeURIComponent(selectedWeek);

            // 🌟 CORRECCIÓN: Redirigir a semana.html 🌟
            // Ahora pasamos los parámetros a la nueva página de listado
            window.location.href = `semana.html?course=${encodedCourse}&week=${encodedWeek}`;
        });

        col.appendChild(card);
        weeksContainer.appendChild(col);
    }
});