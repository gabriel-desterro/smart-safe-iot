<template>
    <div>
        <h5 class="mb-3">Eventos por tipo</h5>
        <Doughnut :data="chartData" :options="chartOptions" />
    </div>
</template>

<script setup>
    import { computed } from 'vue'
    import { Doughnut } from 'vue-chartjs'
    import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

    ChartJS.register(ArcElement, Tooltip, Legend)
    
    const props = defineProps({
        resumo: {
            type: Object,
            default: () => ({})
        },
    })

    const chartData = computed(() => ({
        labels:['Aberturas', 'NFC Negados', 'Intrusões'],
        datasets: [
            {
                data: [
                    props.resumo.aberturas || 0,
                    props.resumo.nfc_negados || 0,
                    props.resumo.intrusoes || 0,
                ],
                backgroundColor: [
                    '#198754', // verde — aberturas
                    '#ffc107', // amarelo — NFC negados
                    '#dc3545', // vermelho — intrusões
                ],
                borderWidth: 2,
            },
        ],
    }))

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {position: 'bottom'},
        },
    }
</script>