interface Bloqueo {
    tiempo_block?: number;
    bloqueado?: boolean;
    tiempo_llegada?: number;
}

interface Proceso {
    nombre: string;
    tiempo_llegada: number;
    rafaga: number;
    bloqueo?: Bloqueo,
    tiempo_comienzo?: number;
    tiempo_ejecutado?: number;
    tiempo_final?: number;
    tiempo_retorno?: number;
    tiempo_espera?: number;
}



// Botones
const btnEnviar: HTMLButtonElement = document.querySelector('#enviar');
const btnEjecutar: HTMLButtonElement = document.querySelector('#ejecutar');
const btnEnviarEjecutar: HTMLButtonElement = document.querySelector('#enviar-ejecutar');
const btnReanudar: HTMLButtonElement = document.querySelector('#reanudar');
const btnBloquear: HTMLButtonElement = document.querySelector('#bloquear');
// Campos de Texto
const txtProceso: HTMLInputElement = document.querySelector('#nombre-proceso');
const txtLlegada: HTMLInputElement = document.querySelector('#tiempo-llegada');
const txtRafaga: HTMLInputElement = document.querySelector('#rafaga');
// Contenedores
const divRojo: HTMLDivElement = document.querySelector('#rojo');
const divVerde: HTMLDivElement = document.querySelector('#verde');
const table: HTMLTableElement = document.querySelector('#table');
const canvas: HTMLCanvasElement = document.querySelector('#canvas');

const ctx = canvas.getContext('2d');

/**
 * Array que guarda los procesos en una cola de espera.
 */
const procesos: Proceso[] = [];
/**
 * Array que guarda los procesos bloqueados.
 */
const bloqueados: Proceso[] = [];
/**
 * Contador de procesos.
 */
let i = 0;
/**
* Determina si la sección crítica ejecuta procesos en tiempo real o en bloque.
*/
let ejecutar = false;
/**
* Almacena un estado si la sección crítica cambia de proceso y hay más procesos en la lista de espera.
*/
let hayProcesos = false;
/**
 * Almacena el ultimo proceso registrado.
 */
let lastProceso: Proceso;
/**
 * Contador de colores.
 */
let cont = 0;
/**
 * Array que almacena los colores que se van a usar para dibujar cada proceso en el diagrama.
 */
const colores = ['red', 'green', 'blue', 'orange', '#7D3C98', 'black'];
/**
 * Almacena la cantidad de segundos que ha trabajado la sección crítica.
 */
let seconds = 0;

/**
 * Función que setea la sección crítica a estado ocupado.
 */
const busy = (): void => {
    divVerde.className = 'verde-inactivo';
    divRojo.className = 'rojo-activo';
};

/**
 * Función que setea la sección crítica a estado desocupado.
 */
const free = (): void => {
    divVerde.className = 'verde-activo';
    divRojo.className = 'rojo-inactivo';
};

/**
 * Función que permite visualizar el cambio de estado de la sección crítica.
 */
const change = (): void => {
    hayProcesos = false;
    free();
    if (1 <= procesos.length) {
        setTimeout(() => { hayProcesos = true }, 1000);
    }
}

/**
 * Función encargada de crear un nuevo proceso a partir de una plantilla.
 * @param { string } nombre Nombre del proceso.
 * @param { number } tiempo_llegada Tiempo de llegada del proceso.
 * @param { number } rafaga Rafaga del proceso.
 * @returns El proceso con sus respectivos datos.
 */
const crearProceso = (
    nombre: string = txtProceso.value,
    tiempo_llegada: number = parseInt(txtLlegada.value),
    rafaga: number = parseInt(txtRafaga.value),
): Proceso => {
    const proceso: Proceso = {
        nombre: nombre,
        tiempo_llegada: tiempo_llegada,
        rafaga: rafaga,
        tiempo_ejecutado: 0,
        tiempo_espera: 0,
        tiempo_comienzo: 0,
        tiempo_final: 0,
        tiempo_retorno: 0,
        bloqueo: {
            tiempo_block: 0,
            tiempo_llegada: 0,
            bloqueado: false
        }
    }
    return proceso;
}

const registrarDatosProceso = (proceso: Proceso) => {
    if (!lastProceso) {
        proceso.tiempo_comienzo = proceso.tiempo_llegada;
    } else {
        proceso.tiempo_comienzo = lastProceso.tiempo_final >= proceso.tiempo_llegada ? 
            lastProceso.tiempo_final : proceso.tiempo_llegada;

        if (proceso.bloqueo.bloqueado) {
            proceso.tiempo_comienzo += proceso.bloqueo.tiempo_block;
        }
    }

    proceso.tiempo_final = proceso.tiempo_comienzo + proceso.tiempo_ejecutado;
    proceso.tiempo_retorno = proceso.bloqueo.bloqueado ?
        proceso.tiempo_final - proceso.bloqueo.tiempo_llegada:proceso.tiempo_final - proceso.tiempo_llegada;
    proceso.tiempo_espera += proceso.tiempo_retorno - proceso.tiempo_ejecutado;
    
    return proceso;
}

/**
 * Función que agrega el proceso en ejecución a la tabla de procesos ejecutados.
 * @param proceso 
 */
const registrarProceso = (proceso: Proceso): void => {
    table.children[1].innerHTML +=
        `<tr>
            <td>${proceso.nombre}</td>
            <td>${proceso.tiempo_llegada}</td>
            <td>${proceso.rafaga}</td>
            <td>${proceso.tiempo_comienzo}</td>
            <td>${proceso.tiempo_final}</td>
            <td>${proceso.tiempo_retorno}</td>
            <td>${proceso.tiempo_espera}</td>
        </tr>`;
}

/**
 * Función que dibuja la recta asociada a cada proceso en el canvas.
 * @param proceso 
 */
const dibujarProceso = (proceso: Proceso): void => {
    if (cont === colores.length) {
        cont = 0;
    } 
    ctx.strokeStyle = colores[cont]; cont++;
    
    /* Dibuja (|) tiempo de llegada */
    ctx.setLineDash([]);
    ctx.beginPath();
    if (proceso.bloqueo.bloqueado) {
        ctx.moveTo(2 + proceso.bloqueo.tiempo_llegada*10, 2 + 35*(i + 1));
        ctx.lineTo(2 + proceso.bloqueo.tiempo_llegada*10, 13 + 35*(i + 1));
    } else {
        ctx.moveTo(2 + proceso.tiempo_llegada*10, 2 + 35*(i + 1));
        ctx.lineTo(2 + proceso.tiempo_llegada*10, 13 + 35*(i + 1));
    }
    ctx.stroke();

    /* Dibuja (|) tiempo de comienzo */
    ctx.beginPath();
    ctx.moveTo(2 + proceso.tiempo_comienzo*10, 2 + 35*(i + 1));
    ctx.lineTo(2 + proceso.tiempo_comienzo*10, 13 + 35*(i + 1));
    ctx.stroke();

    /* Dibuja (|) tiempo ejecutado */
    ctx.beginPath();
    ctx.moveTo(2 + (proceso.tiempo_comienzo + proceso.tiempo_ejecutado)*10, 2 + 35*(i + 1));
    ctx.lineTo(2 + (proceso.tiempo_comienzo + proceso.tiempo_ejecutado)*10, 13 + 35*(i + 1));
    ctx.stroke();

    /* Dibuja linea desde tiempo de llegada hasta tiempo de comienzo (Tiempo Ejecucion) */
    ctx.beginPath();
    ctx.moveTo(2 + proceso.tiempo_comienzo*10, 7.5 + 35*(i + 1));
    ctx.lineTo(2 + (proceso.tiempo_comienzo + proceso.tiempo_ejecutado)*10, 7.5 + 35*(i + 1));
    ctx.stroke();

    /* Dibuja linea desde tiempo de llegada hasta tiempo de comienzo (Tiempo Espera) */
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (proceso.bloqueo.bloqueado) {
        ctx.moveTo(2 + proceso.bloqueo.tiempo_llegada*10, 7.5 + 35*(i + 1));
        ctx.lineTo(2 + proceso.tiempo_comienzo*10, 7.5 + 35*(i + 1));
    } else {
        ctx.moveTo(2 + proceso.tiempo_llegada*10, 7.5 + 35*(i + 1));
        ctx.lineTo(2 + proceso.tiempo_comienzo*10, 7.5 + 35*(i + 1));
    }
    ctx.stroke();
}

/**
 * Funcion que permite agregar un proceso a la cola de espera.
 */
const enviarProceso = (): void => {
    const proceso: Proceso = crearProceso();

    if (!proceso.nombre || isNaN(proceso.tiempo_llegada) || isNaN(proceso.rafaga)) {
        alert('No se admiten campos vacíos. Intente nuevamente.');
        return;
    }

    if (lastProceso && proceso.tiempo_llegada < lastProceso.tiempo_llegada) {
        alert(`El tiempo del proceso ${proceso.nombre} debe ser mayor o igual a ${lastProceso.tiempo_llegada}`);
        return;
    }

    procesos.push(proceso);
    txtProceso.value = ''; txtLlegada.value = ''; txtRafaga.value = '';
    ejecutar = false; hayProcesos = true;
}

/**
 * Función que se encarga de ejecutar los procesos que están actualmente en la cola de espera.
 */
const ejecutarProceso = (): void => {
    ejecutar = true;
}

/**
 * Función que se encarga de agregar un nuevo proceso a la cola de espera en tiempo de ejecución.
 */
const enviarEjecutarProceso = (): void => {
    enviarProceso();
    ejecutarProceso();
}

/**
 * Función encargada de bloquear un proceso.
 */
const bloquearProceso = (): void => {
    if (!hayProcesos) {
        return;
    }

    const proceso: Proceso = registrarDatosProceso(procesos.splice(0, 1)[0]);
    bloqueados.push(proceso);
    registrarProceso(proceso);
    dibujarProceso(proceso);
    change();
    lastProceso = proceso;
    i++;

    alert(`El proceso ${ proceso.nombre } ha sido bloqueado.`);
}

const ordenarProcesos = (): void => {
    const p = procesos.sort((a, b) => {
        if (seconds < a.tiempo_llegada || seconds < b.tiempo_llegada) {
            return 0;
        }

        return a.rafaga - b.rafaga;
    });

    console.log(p);
}

/**
 * Función encargada del manejo de la sección crítica.
 */
const handlerSeccionCritica = (): void => {
    if (!hayProcesos || !ejecutar) {
        return;
    }

    if (procesos[0].tiempo_ejecutado < procesos[0].rafaga) {
        busy();
        procesos[0].tiempo_ejecutado++;
        seconds++;
    } else {
        const proceso: Proceso = registrarDatosProceso(procesos.splice(0, 1)[0]);
        dibujarProceso(proceso);
        registrarProceso(proceso);
        ordenarProcesos();
        change();
        lastProceso = proceso;
        i++;
    }
}

/**
 * Función encargada del manejo de los procesos bloqueados.
 * El tiempo de bloqueo de un proceso es de 5s.
 */
const handlerColaBloqueo = (): void => {
    if (bloqueados.length > 0) {
        if (bloqueados[0].bloqueo.tiempo_block < 5) {
            bloqueados[0].bloqueo.tiempo_block++;
        } else {
            const proceso_bloqueado: Proceso = bloqueados.splice(0, 1)[0];
            const proceso_reanudado: Proceso = crearProceso(
                `${ proceso_bloqueado.nombre }*`,
                proceso_bloqueado.tiempo_llegada,
                proceso_bloqueado.rafaga - proceso_bloqueado.tiempo_ejecutado
            );
            proceso_reanudado.bloqueo.bloqueado = true;
            proceso_reanudado.bloqueo.tiempo_block = proceso_bloqueado.bloqueo.tiempo_block;
            proceso_reanudado.bloqueo.tiempo_llegada = proceso_bloqueado.tiempo_comienzo + proceso_bloqueado.tiempo_ejecutado;
            proceso_reanudado.tiempo_espera = proceso_bloqueado.tiempo_espera;

            procesos.push(proceso_reanudado);

            alert(`El proceso ${ proceso_bloqueado.nombre } ha sido desbloqueado.`);
            hayProcesos = true;

            // 
        }
    }
}

/**
 * Función que dibuja la recta numérica inicial del diagrama.
 */
const iniciarDiagrama = (): void => {
    ctx.fillStyle = '#F4F6F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.font = '10pt Arial';

    ctx.moveTo(0, 7.5);
    ctx.lineTo(canvas.width, 7.5);

    for(let j = 0; j <= canvas.width/10; j++) {
        ctx.moveTo(2 + j*10, 2);
        ctx.lineTo(2 + j*10, 13);
        ctx.stroke();

        if (j % 5 === 0) {
            if (j >= 10) {
                ctx.fillText(j.toString(), j*10 - 5, 30);
            } else {
                ctx.fillText(j.toString(), j*10, 30);
            }
        }
    }
}

const seccionCritica = setInterval(handlerSeccionCritica, 1000);
const colaBloqueados = setInterval(handlerColaBloqueo, 1000);

btnEnviar.addEventListener('click', () => {
    enviarProceso();
});

btnEjecutar.addEventListener('click', () => {
    ejecutarProceso();
});

btnEnviarEjecutar.addEventListener('click', () => {
    enviarEjecutarProceso();
});

btnBloquear.addEventListener('click', () => {
    bloquearProceso();
});

btnReanudar.addEventListener('click', () => {
    // reanudarProceso();
});

free();
iniciarDiagrama();