
let workoutData = [];
let filteredData = [];
let charts = {};
let exerciseTableData = [];
let showingRows = 10;
let currentSort = { column: 'sets', direction: 'desc' };

// Configuración de carga de archivos
const fileUpload = document.getElementById('fileUpload');
const fileInput = document.getElementById('fileInput');
const errorContainer = document.getElementById('errorContainer');
const statsContainer = document.getElementById('statsContainer');
const controlsContainer = document.getElementById('controlsContainer');
const uploadSection = document.getElementById('uploadSection');
const timeRangeSelect = document.getElementById('timeRange');
const exerciseSelect = document.getElementById('exerciseSelect');
const showMoreBtn = document.getElementById('showMoreBtn');

fileUpload.addEventListener('click', () => fileInput.click());
fileUpload.addEventListener('dragover', handleDragOver);
fileUpload.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
timeRangeSelect.addEventListener('change', handleTimeRangeChange);
exerciseSelect.addEventListener('change', handleExerciseChange);
showMoreBtn.addEventListener('click', handleShowMore);

function handleDragOver(e) {
    e.preventDefault();
    fileUpload.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    fileUpload.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showError('Por favor selecciona un archivo CSV válido.');
        return;
    }

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                showError('Error al procesar el archivo CSV: ' + results.errors[0].message);
                return;
            }
            
            workoutData = results.data;
            processData();
            populateExerciseSelect();
            applyTimeFilter();
            showStats();
        },
        error: function(error) {
            showError('Error al leer el archivo: ' + error.message);
        }
    });
}

function showError(message) {
    errorContainer.innerHTML = `<div class="error">${message}</div>`;
    statsContainer.classList.add('hidden');
    controlsContainer.classList.add('hidden');
}

function processData() {
    // Limpiar datos y convertir tipos
    workoutData = workoutData.map(row => ({
        ...row,
        weight_kg: parseFloat(row.weight_kg) || 0,
        reps: parseInt(row.reps) || 0,
        duration_seconds: parseInt(row.duration_seconds) || 0,
        rpe: parseFloat(row.rpe) || 0,
        start_time: new Date(row.start_time),
        end_time: new Date(row.end_time)
    })).filter(row => !isNaN(row.start_time.getTime()));
}

function populateExerciseSelect() {
    // Contar frecuencia de ejercicios
    const exerciseFreq = {};
    workoutData.forEach(row => {
        exerciseFreq[row.exercise_title] = (exerciseFreq[row.exercise_title] || 0) + 1;
    });

    // Ordenar por frecuencia
    const sortedExercises = Object.entries(exerciseFreq)
        .sort(([,a], [,b]) => b - a)
        .map(([name]) => name);

    exerciseSelect.innerHTML = '';
    sortedExercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        exerciseSelect.appendChild(option);
    });

    // Seleccionar Incline bench press si existe, sino el más frecuente
    if (sortedExercises.includes('Incline Bench Press (Dumbbell)')) {
        exerciseSelect.value = 'Incline Bench Press (Dumbbell)';
    } else if (sortedExercises.length > 0) {
        exerciseSelect.value = sortedExercises[0];
    }
}

function applyTimeFilter() {
    const now = new Date();
    const timeRange = timeRangeSelect.value;
    let startDate = new Date(0); // Fecha muy antigua por defecto

    switch (timeRange) {
        case 'currentYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'lastYear':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        case 'last6months':
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        case 'last3months':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'lastMonth':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }

    filteredData = workoutData.filter(row => row.start_time >= startDate);
}

function handleTimeRangeChange() {
    applyTimeFilter();
    updateStats();
}

function handleExerciseChange() {
    createProgressChart();
}

function handleShowMore() {
    showingRows += 10;
    updateExerciseTable();
}

function showStats() {
    errorContainer.innerHTML = '';
    uploadSection.classList.add('hidden');
    controlsContainer.classList.remove('hidden');
    statsContainer.classList.remove('hidden');
    
    updateStats();
}

function updateStats() {
    calculateBasicStats();
    createCharts();
    createStagnantExercisesTable();
    prepareExerciseTableData();
    updateExerciseTable();
}

function calculateBasicStats() {
    // Contar entrenamientos únicos por título y fecha
    const uniqueWorkouts = new Set();
    filteredData.forEach(row => {
        const dateStr = row.start_time.toDateString();
        uniqueWorkouts.add(`${row.title}-${dateStr}`);
    });

    const uniqueExercises = new Set(filteredData.map(row => row.exercise_title)).size;
    const totalSets = filteredData.length;
    const totalVolume = filteredData.reduce((sum, row) => sum + (row.weight_kg * row.reps), 0);

    document.getElementById('totalWorkouts').textContent = uniqueWorkouts.size;
    document.getElementById('totalExercises').textContent = uniqueExercises;
    document.getElementById('totalSets').textContent = totalSets;
    document.getElementById('totalVolume').textContent = Math.round(totalVolume).toLocaleString();
}

function createCharts() {
    createVolumeChart();
    createProgressChart();
    createFrequencyChart();
    createWorkoutFrequencyChart();
}

function createVolumeChart() {
    const exerciseVolume = {};
    filteredData.forEach(row => {
        const volume = row.weight_kg * row.reps;
        exerciseVolume[row.exercise_title] = (exerciseVolume[row.exercise_title] || 0) + volume;
    });

    const sortedExercises = Object.entries(exerciseVolume)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const ctx = document.getElementById('volumeChart').getContext('2d');
    if (charts.volume) charts.volume.destroy();
    
    charts.volume = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedExercises.map(([name]) => name),
            datasets: [{
                label: 'Volumen (kg)',
                data: sortedExercises.map(([, volume]) => Math.round(volume)),
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#ecf0f1'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                },
                x: {
                    grid: {
                        color: '#ecf0f1'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                }
            }
        }
    });
}

function createProgressChart() {
    const selectedExercise = exerciseSelect.value;
    
    // Obtener peso máximo por sesión (día + título)
    const sessionsMap = new Map();
    
    filteredData
        .filter(row => row.exercise_title === selectedExercise)
        .forEach(row => {
            const sessionKey = `${row.title}-${row.start_time.toDateString()}`;
            if (!sessionsMap.has(sessionKey) || sessionsMap.get(sessionKey).weight < row.weight_kg) {
                sessionsMap.set(sessionKey, {
                    date: row.start_time,
                    weight: row.weight_kg
                });
            }
        });

    const exerciseData = Array.from(sessionsMap.values())
        .sort((a, b) => a.date - b.date);

    document.getElementById('progressChartTitle').textContent = `Progreso de Peso - ${selectedExercise}`;

    const ctx = document.getElementById('progressChart').getContext('2d');
    if (charts.progress) charts.progress.destroy();

    if (exerciseData.length === 0) {
        // Mostrar mensaje de no datos
        ctx.font = '16px Segoe UI';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos para este ejercicio', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    charts.progress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: exerciseData.map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: `${selectedExercise} (kg)`,
                data: exerciseData.map(d => d.weight),
                borderColor: '#2c3e50',
                backgroundColor: 'rgba(44, 62, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#c0392b',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#ecf0f1'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                },
                x: {
                    grid: {
                        color: '#ecf0f1'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                }
            }
        }
    });
}

function createFrequencyChart() {
    const dayFrequency = {};
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Contar entrenamientos únicos por día
    const uniqueWorkouts = new Set();
    filteredData.forEach(row => {
        const dateStr = row.start_time.toDateString();
        const day = row.start_time.getDay();
        const workoutKey = `${row.title}-${dateStr}`;
        if (!uniqueWorkouts.has(workoutKey)) {
            uniqueWorkouts.add(workoutKey);
            dayFrequency[day] = (dayFrequency[day] || 0) + 1;
        }
    });

    // Crear ranking de días
    const dayRanking = days.map((day, index) => ({
        day,
        index,
        count: dayFrequency[index] || 0
    })).sort((a, b) => b.count - a.count);

    // Asignar rankings
    const dayLabels = days.map((day, index) => {
        const rank = dayRanking.findIndex(item => item.index === index) + 1;
        const count = dayFrequency[index] || 0;
        return count > 0 ? `${rank}. ${day}` : day;
    });

    const ctx = document.getElementById('frequencyChart').getContext('2d');
    if (charts.frequency) charts.frequency.destroy();

    charts.frequency = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dayLabels,
            datasets: [{
                data: days.map((_, i) => dayFrequency[i] || 0),
                backgroundColor: [
                    '#95a5a6', '#7f8c8d', '#34495e', '#2c3e50',
                    '#bdc3c7', '#ecf0f1', '#e74c3c'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#2c3e50',
                        padding: 15
                    }
                }
            }
        }
    });
}

function createWorkoutFrequencyChart() {
    // Contar entrenamientos únicos por título
    const workoutFreq = {};
    const uniqueWorkouts = new Set();
    
    filteredData.forEach(row => {
        const dateStr = row.start_time.toDateString();
        const workoutKey = `${row.title}-${dateStr}`;
        if (!uniqueWorkouts.has(workoutKey)) {
            uniqueWorkouts.add(workoutKey);
            workoutFreq[row.title] = (workoutFreq[row.title] || 0) + 1;
        }
    });

    const sortedWorkouts = Object.entries(workoutFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const ctx = document.getElementById('workoutFrequencyChart').getContext('2d');
    if (charts.workoutFreq) charts.workoutFreq.destroy();

    charts.workoutFreq = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedWorkouts.map(([name]) => name),
            datasets: [{
                label: 'Frecuencia',
                data: sortedWorkouts.map(([, freq]) => freq),
                backgroundColor: '#2c3e50',
                borderColor: '#34495e',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#ecf0f1'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                },
                x: {
                    grid: {
                        color: '#ecf0f1'
                    },
                    ticks: {
                        color: '#7f8c8d'
                    }
                }
            }
        }
    });
}

function createStagnantExercisesTable() {
    // Obtener peso máximo por sesión para cada ejercicio
    const exerciseProgress = {};

    filteredData.forEach(row => {
        // Ignorar si el peso es 0
        if (row.weight_kg === 0) return;

        const sessionKey = `${row.title}-${row.start_time.toDateString()}`;
        const exercise = row.exercise_title;

        if (!exerciseProgress[exercise]) {
            exerciseProgress[exercise] = new Map();
        }

        if (
            !exerciseProgress[exercise].has(sessionKey) || 
            exerciseProgress[exercise].get(sessionKey).weight < row.weight_kg
        ) {
            exerciseProgress[exercise].set(sessionKey, {
                date: row.start_time,
                weight: row.weight_kg
            });
        }
    });


    // Analizar estancamiento
    const stagnantData = [];
    
    Object.entries(exerciseProgress).forEach(([exercise, sessions]) => {
        const sortedSessions = Array.from(sessions.values())
            .sort((a, b) => a.date - b.date);
        
        if (sortedSessions.length < 3) return; // Necesitamos al menos 3 sesiones
        
        let maxWeight = 0;
        let lastImprovementIndex = -1;
        let sessionsWithoutProgress = 0;
        
        sortedSessions.forEach((session, index) => {
            if (session.weight > maxWeight) {
                maxWeight = session.weight;
                lastImprovementIndex = index;
            }
        });
        
        sessionsWithoutProgress = sortedSessions.length - 1 - lastImprovementIndex;
        
        if (sessionsWithoutProgress >= 2) { // Al menos 2 sesiones sin progreso
            stagnantData.push({
                exercise,
                sessionsWithoutProgress,
                maxWeight,
                lastImprovement: lastImprovementIndex >= 0 ? 
                    sortedSessions[lastImprovementIndex].date.toLocaleDateString() : 'N/A'
            });
        }
    });

    // Ordenar por sesiones sin progreso
    stagnantData.sort((a, b) => b.sessionsWithoutProgress - a.sessionsWithoutProgress);

    // Actualizar tabla
    const tbody = document.querySelector('#stagnantExercisesTable tbody');
    tbody.innerHTML = '';

    stagnantData.slice(0, 10).forEach(data => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #ecf0f1;">${data.exercise}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ecf0f1; color: #e74c3c; font-weight: 600;">${data.sessionsWithoutProgress}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ecf0f1;">${data.maxWeight.toFixed(1)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ecf0f1;">${data.lastImprovement}</td>
        `;
        
        if (tbody.children.length % 2 === 0) {
            row.style.backgroundColor = '#f8f9fa';
        }
    });
}

function prepareExerciseTableData() {
    const exerciseStats = {};
    
    filteredData.forEach(row => {
        if (!exerciseStats[row.exercise_title]) {
            exerciseStats[row.exercise_title] = {
                exercise: row.exercise_title,
                sets: 0,
                maxWeight: 0,
                totalVolume: 0
            };
        }
        
        const stats = exerciseStats[row.exercise_title];
        stats.sets++;
        stats.maxWeight = Math.max(stats.maxWeight, row.weight_kg);
        stats.totalVolume += row.weight_kg * row.reps;
    });

    exerciseTableData = Object.values(exerciseStats);
    sortTableData();
    showingRows = 10; // Reset al cambiar filtros
}

function sortTableData() {
    const { column, direction } = currentSort;
    exerciseTableData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

function updateExerciseTable() {
    const tbody = document.querySelector('#exercisesTable tbody');
    tbody.innerHTML = '';

    const displayData = exerciseTableData.slice(0, showingRows);
    
    displayData.forEach(stats => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${stats.exercise}</td>
            <td>${stats.sets}</td>
            <td>${stats.maxWeight.toFixed(1)}</td>
            <td>${Math.round(stats.totalVolume).toLocaleString()}</td>
        `;
    });

    // Actualizar botón "Mostrar más"
    showMoreBtn.disabled = showingRows >= exerciseTableData.length;
    showMoreBtn.textContent = showingRows >= exerciseTableData.length ? 
        'No hay más datos' : `Mostrar más (${exerciseTableData.length - showingRows} restantes)`;

    updateSortIndicators();
}

function updateSortIndicators() {
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.column === currentSort.column) {
            th.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// Event listeners para ordenamiento de tabla
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('th[data-column]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.column;
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'desc';
            }
            sortTableData();
            showingRows = 10; // Reset al ordenar
            updateExerciseTable();
        });
    });
});
