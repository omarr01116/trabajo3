document.addEventListener('DOMContentLoaded', () => {
    // 1. OBTENER PARÁMETROS DE LA URL (Nombre del curso)
    const urlParams = new URLSearchParams(window.location.search);
    let courseName = urlParams.get('name');

    // Limpiar el nombre del curso para mostrarlo
    if (courseName) {
        courseName = decodeURIComponent(courseName.replace(/\+/g, ' '));
    } else {
        courseName = "Curso No Seleccionado";
    }

    // 2. ACTUALIZAR EL TÍTULO DE LA PÁGINA
    const courseTitleElement = document.getElementById('course-title');
    courseTitleElement.textContent = `Semanas de ${courseName}`;
    document.title = `Curso: ${courseName} - OMAR`;

    // 3. GENERAR LAS 16 TARJETAS DE SEMANA
    const weeksContainer = document.getElementById('weeks-container');
    const totalWeeks = 16; 

    for (let i = 1; i <= totalWeeks; i++) {
        const weekNumber = i;
        const weekTitle = `Semana ${weekNumber}`; 
        
        const col = document.createElement('div');
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
            
            const encodedCourse = encodeURIComponent(selectedCourse);
            const encodedWeek = encodeURIComponent(selectedWeek);

            // 🌟 ESTA LÍNEA DEBE APUNTAR A SEMANA.HTML 🌟
            window.location.href = `semana.html?course=${encodedCourse}&week=${encodedWeek}`;
        });

        col.appendChild(card);
        weeksContainer.appendChild(col);
    }
});