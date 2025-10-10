document.addEventListener('DOMContentLoaded', () => {
    // 1. OBTENER PARÁMETROS DE LA URL (Curso y Semana)
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const week = urlParams.get('week');

    // Decodificar los nombres (si contienen espacios o caracteres especiales)
    const courseName = course ? decodeURIComponent(course.replace(/\+/g, ' ')) : 'Curso Desconocido';
    const weekName = week ? decodeURIComponent(week.replace(/\+/g, ' ')) : 'Semana Desconocida';
    
    // 2. ACTUALIZAR TÍTULOS EN EL HTML
    document.getElementById('course-name-display').textContent = courseName;
    document.getElementById('week-name-display').textContent = weekName;
    document.getElementById('week-title-short').textContent = weekName;
    document.title = `${weekName} de ${courseName} - OMAR`;

    // 3. CONFIGURAR EL BOTÓN DE VOLVER A CURSO.HTML
    const backButton = document.getElementById('back-to-course-btn');

    // Codificar el nombre del curso para regresarlo a curso.html
    const encodedCourse = encodeURIComponent(courseName);

    // El botón de volver regresa a curso.html con el nombre del curso
    backButton.addEventListener('click', () => {
        window.location.href = `curso.html?name=${encodedCourse}`;
    });

    // 4. (TO-DO): AGREGAR AQUÍ LA LÓGICA DE SUPABASE PARA LISTAR ARCHIVOS 
    //            FILTRANDO POR 'courseName' y 'weekName'.
    
    // Aquí iría una función como: loadFiles(courseName, weekName);
});