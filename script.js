// ========================================
// Configuration & Data
// ========================================

const CONFIG = {
    principal: {
        type: 'ranges',
        ranges: [
            { max: 1000000, step: 10000 },       // 0 - 100万: 步长1万
            { max: 10000000, step: 100000 },     // 100万 - 1000万: 步长10万 (Corrected: start directly with larger step after 1m)
            { max: 100000000, step: 1000000 },   // 1000万 - 1亿: 步长100万
            { max: 1000000000, step: 10000000 }  // 1亿 - 1000亿: 步长1000万
        ],
        typeDefault: 500000, // Updated lower default
        format: (val) => {
            if (val >= 100000000) {
                const yi = val / 100000000;
                return `${yi.toFixed(yi % 1 === 0 ? 0 : 1)} 亿元`;
            }
            return `${(val / 10000).toFixed(0)} 万元`;
        }
    },
    rate: {
        min: 0,
        max: 50,
        step: 0.5,
        default: 8,
        format: (val) => `${val.toFixed(1)}%`
    },
    income: {
        type: 'ranges',
        ranges: [
            { max: 20000, step: 1000 },          // 0 - 2万: 步长1000
            { max: 100000, step: 5000 },         // 2万 - 10万: 步长5000
            { max: 1000000, step: 10000 }        // 10万 - 100万: 步长1万
        ],
        typeDefault: 20000,
        format: (val) => val >= 100000
            ? `${(val / 10000).toFixed(0)} 万/月`
            : `${val.toLocaleString()} 元/月`
    },
    currentExpense: {
        type: 'ranges',
        ranges: [
            { max: 10000, step: 500 },           // 0 - 1万: 步长500
            { max: 100000, step: 1000 },         // 1万 - 10万: 步长1000
            { max: 1000000, step: 5000 }         // 10万+: 步长5000
        ],
        typeDefault: 5000,
        format: (val) => val >= 100000
            ? `${(val / 10000).toFixed(0)} 万/月`
            : `${val.toLocaleString()} 元/月`
    },
    inflation: {
        min: 0,
        max: 15,
        step: 0.5,
        default: 3,
        format: (val) => `${val.toFixed(1)}%`
    },
    age: {
        min: 18,
        max: 80,
        step: 1,
        default: 30,
        format: (val) => `${val}岁`
    }
};

const LIFESTYLES = [
    { name: '生存模式', icon: '🍜', cost: 3000, emoji: '🌾', color: '#8b5cf6', desc: '基础温饱 (食宿刚需)' },
    { name: '小康生活', icon: '🏡', cost: 10000, emoji: '🌱', color: '#06b6d4', desc: '舒适安居 (偶尔旅行)' },
    { name: '舒适生活', icon: '🚗', cost: 30000, emoji: '🌿', color: '#10b981', desc: '高质生活 (车房无忧)' },
    { name: '品质生活', icon: '🍷', cost: 60000, emoji: '🌳', color: '#f59e0b', desc: '轻奢享受 (高端医疗)' },
    { name: '富裕生活', icon: '💼', cost: 120000, emoji: '🌸', color: '#f97316', desc: '财富自由 (全球旅居)' },
    { name: '奢华生活', icon: '💎', cost: 250000, emoji: '🏆', color: '#ef4444', desc: '顶层人生 (私人订制)' },
    { name: '顶级生活', icon: '👑', cost: 500000, emoji: '🌴', color: '#ec4899', desc: '家族传承 (资产配置)' },
    { name: '极境生活', icon: '🌌', cost: 1000000, emoji: '⭐', color: '#fbbf24', desc: '无限可能 (回馈社会)' }
];

// ========================================
// State Management
// ========================================

const state = {
    principal: CONFIG.principal.typeDefault,
    rate: CONFIG.rate.default,
    income: CONFIG.income.typeDefault,
    currentExpense: CONFIG.currentExpense.typeDefault,
    inflation: CONFIG.inflation.default,
    age: CONFIG.age.default,
    growthChart: null // Store chart instance
};

// ========================================
// Picker Component
// ========================================

class Picker {
    constructor(id, type, config) {
        this.container = document.getElementById(id);
        this.type = type;
        this.config = config;
        this.config = config;
        this.current = config.typeDefault || config.default;
        this.items = [];
        this.items = [];
        this.isScrolling = false;
        this.scrollTimeout = null;

        this.init();
    }

    init() {
        this.generateItems();
        this.render();
        this.attachEvents();
        this.scrollToValue(this.current);
    }

    generateItems() {
        this.items = [];

        if (this.config.type === 'ranges') {
            let val = 0;
            this.config.ranges.forEach((range, index) => {
                const step = range.step;

                // Handle transition: If not first range, align next value to new step
                if (index > 0) {
                    // Start from the last value + new step
                    // This creates the "leap" (e.g. 100w -> 110w instead of 101w)
                    if (this.items.length > 0) {
                        val = this.items[this.items.length - 1] + step;
                    }
                } else if (index === 0 && val === 0 && step > 0) {
                    // If range starts at 0 but has a step, ensure we increment if we wanted to skip 0
                    // But we want to allow 0 now, so we just let it be 0 if step is 0 or whatever.
                    // The logic below adds val. 
                    // If we want 0, we push 0.
                    // If step is 0 (special case for just 0 value), we push 0 and break?
                    if (range.max === 0) {
                        this.items.push(0);
                        return; // Done with this zero-range
                    }
                }

                while (val <= range.max) {
                    // Avoid duplicates if ranges overlap or touch awkwardly
                    if (this.items.length === 0 || val > this.items[this.items.length - 1]) {
                        this.items.push(val);
                    }
                    val += step;
                }
            });

        } else {
            // Standard linear logic
            for (let val = this.config.min; val <= this.config.max; val += this.config.step) {
                this.items.push(val);
            }
        }
    }

    render() {
        this.container.innerHTML = this.items.map((val, index) =>
            `<div class="picker-item" data-index="${index}" data-value="${val}">
                ${this.config.format(val)}
            </div>`
        ).join('');
    }

    attachEvents() {
        // Scroll event
        this.container.addEventListener('scroll', this.handleScroll.bind(this));

        // Touch/Mouse drag support
        let startY = 0;
        let scrollTop = 0;

        this.container.addEventListener('mousedown', (e) => {
            startY = e.pageY;
            scrollTop = this.container.scrollTop;
            this.container.style.cursor = 'grabbing';
        });

        this.container.addEventListener('mousemove', (e) => {
            if (startY !== 0) {
                const deltaY = startY - e.pageY;
                this.container.scrollTop = scrollTop + deltaY;
            }
        });

        this.container.addEventListener('mouseup', () => {
            startY = 0;
            this.container.style.cursor = 'grab';
        });

        this.container.addEventListener('mouseleave', () => {
            startY = 0;
            this.container.style.cursor = 'grab';
        });
    }

    handleScroll() {
        this.isScrolling = true;

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.snapToNearest();
            this.isScrolling = false;
        }, 150);

        this.updateSelection();
    }

    updateSelection() {
        const scrollTop = this.container.scrollTop;
        const itemHeight = 44; // matches CSS

        // Simple calculation: which item index is at scrollTop position
        // Since items start at padding (68px), the first item (index 0) is at scroll position 0
        // due to how scroll container works
        const centerIndex = Math.round(scrollTop / itemHeight);

        // Remove all selected classes
        this.container.querySelectorAll('.picker-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selected class to center item
        const centerItem = this.container.querySelector(`[data-index="${centerIndex}"]`);
        if (centerItem) {
            centerItem.classList.add('selected');
            this.current = parseFloat(centerItem.dataset.value);
            this.updateDisplay();
        }
    }

    snapToNearest() {
        const itemHeight = 44;
        const scrollTop = this.container.scrollTop;

        // Find nearest index and scroll to it
        const nearestIndex = Math.round(scrollTop / itemHeight);
        const targetScroll = nearestIndex * itemHeight;

        this.container.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
    }

    scrollToValue(value) {
        const index = this.items.indexOf(value);
        if (index !== -1) {
            const itemHeight = 44;
            const targetScroll = index * itemHeight;

            setTimeout(() => {
                this.container.scrollTop = Math.max(0, targetScroll);
                this.updateSelection();
            }, 100);
        }
    }

    updateDisplay() {
        const displayId = `${this.type}-value`;
        const display = document.getElementById(displayId);
        if (display) {
            display.textContent = this.config.format(this.current);
        }

        // Update state
        state[this.type] = this.current;
    }

    getValue() {
        return this.current;
    }
}

// ========================================
// Calculation Engine
// ========================================
function calculateFinancialFreedom(principal, annualRate, monthlyIncome, currentMonthlyExpense, targetMonthlyExpense, inflationRate, startAge) {
    const maxYears = 50;
    let currentPrincipal = principal; // 这里的单位是：具有“当前购买力”的货币

    // 1. 核心：计算实际利率 (Real Rate)
    // 你的公式: Real = Nominal - Inflation
    const realRateDecimal = (annualRate - inflationRate) / 100;

    // 2. 核心：储蓄保持不变 (Constant Purchasing Power)
    // 我们假设工资涨幅 = 通胀，所以你每年能存下的“购买力”是恒定的
    // 不需要再在这个变量上乘 inflationRate 了！
    const monthlySavings = monthlyIncome - currentMonthlyExpense;
    const annualSavings = monthlySavings * 12;

    const history = [];
    let achievedYear = -1;
    let achievedExpense = 0;

    for (let year = 0; year <= maxYears; year++) {
        const currentAge = startAge + year;

        // 3. 目标开销保持不变 (Real Terms)
        // 既然使用的是实际利率模型，且假设通胀对支出和收入的影响被相互抵消（或视为恒定购买力），
        // 那么目标开销保持不变。
        const currentTargetExpense = targetMonthlyExpense;

        // 4. 计算被动收入 (Safe Withdrawal)
        // 注意：这里必须用 Real Rate 计算被动收入！
        // 为什么？因为如果你用名义利率(比如7%)花钱，本金就没法抗通胀了。
        // 只有花掉“实际收益(比如3%)”，本金剩下的部分才能抵消通胀。
        const annualPassiveIncome = currentPrincipal * realRateDecimal;
        const monthlyPassiveIncome = annualPassiveIncome / 12;

        const isAchieved = monthlyPassiveIncome >= currentTargetExpense;

        if (isAchieved && achievedYear === -1) {
            achievedYear = year;
            achievedExpense = currentTargetExpense;
        }

        history.push({
            year,
            age: currentAge,
            principal: Math.round(currentPrincipal),
            passiveIncome: Math.round(monthlyPassiveIncome),
            adjustedExpense: Math.round(currentTargetExpense),
            achieved: isAchieved
        });

        // 5. 更新本金
        // 增长 = 本金 * 实际利率 + 固定的年储蓄(购买力)
        const growthFromInterest = currentPrincipal * realRateDecimal;

        // 这里的 annualSavings 不需要变大，因为它代表的是“价值”而不是“面额”
        currentPrincipal = currentPrincipal + growthFromInterest + annualSavings;
    }

    return {
        years: achievedYear,
        history: history,
        finalPrincipal: history[history.length - 1].principal,
        passiveIncome: history[history.length - 1].passiveIncome,
        adjustedExpense: history[history.length - 1].adjustedExpense,
        achieved: achievedYear !== -1,
        achievedExpense: achievedYear !== -1 ? Math.round(achievedExpense) : Math.round(targetMonthlyExpense)
    };
}

function generateResults() {
    const { principal, rate, income, currentExpense, inflation, age } = state;

    return LIFESTYLES.map(lifestyle => {
        const result = calculateFinancialFreedom(
            principal,
            rate,
            income,
            currentExpense,
            lifestyle.cost,
            inflation,
            age
        );

        // 计算所需名义本金（基于初始购买力）：targetMonthlyExpense * 12 / (名义利率)
        // 注意：随着时间推移，考虑通胀后所需的本金实际上会更高
        const requiredPrincipal = (lifestyle.cost * 12) / (rate / 100);

        return {
            ...lifestyle,
            ...result,
            requiredPrincipal: Math.round(requiredPrincipal)
        };
    });
}

// ========================================
// UI Rendering
// ========================================

function renderResults(results) {
    const resultSection = document.getElementById('result-section');
    const cardsContainer = document.getElementById('result-cards');

    // 更新摘要
    document.getElementById('current-principal').textContent =
        `¥${(state.principal / 10000).toFixed(1)}万`;
    document.getElementById('current-rate').textContent =
        `${state.rate.toFixed(1)}%`;
    if (document.getElementById('current-inflation')) {
        document.getElementById('current-inflation').textContent =
            `${state.inflation.toFixed(1)}%`;
    }
    document.getElementById('current-savings').textContent =
        `¥${(state.income - state.currentExpense).toLocaleString()}/月`;

    // 渲染卡片
    if (cardsContainer) {
        cardsContainer.innerHTML = results.map((result, index) => {
            let statusClass = result.achieved ? 'card-achieved' : 'card-impossible';
            let statusText = '';
            let yearsDisplay = '';

            if (result.achieved) {
                if (result.years === 0) {
                    statusText = '已达成 ✓';
                    yearsDisplay = '立即达成';
                } else {
                    statusText = '可达成 ✓';
                    yearsDisplay = `${result.years} 年后`;
                }
            } else {
                statusText = '需调整参数';
                yearsDisplay = '> 50年';
            }

            // 计算进度（仅作为视觉参考，计算被动收入相对于调整后支出的比例）
            const progress = result.achieved ? 100 : Math.min(100, Math.round((result.passiveIncome / result.adjustedExpense) * 100));

            return `
                <div class="result-card ${statusClass}" style="--card-color: ${result.color}; --delay: ${index * 0.1}s">
                    <div class="card-header">
                        <div class="card-icon-bg">
                            <span class="card-icon">${result.icon}</span>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-name">${result.name}</h3>
                            <span class="card-desc">${result.desc}</span>
                            <span class="card-status-badge">${statusText}</span>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="card-metric">
                            <div class="metric-label">预计月支出 (达成时)</div>
                            <div class="metric-value">¥${result.achievedExpense.toLocaleString()}</div>
                        </div>
                        
                        <div class="card-metric">
                            <div class="metric-label">预计达成时间</div>
                            <div class="metric-value highlight">${yearsDisplay}</div>
                        </div>

                        <div class="progress-info">
                            <div class="progress-labels">
                                <span>目标达成率</span>
                                <span>${progress}%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card-footer">
                        <div class="footer-info">
                            <span class="info-label">所需名义本金</span>
                            <span class="info-value">¥${(result.requiredPrincipal / 10000).toFixed(1)}万</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染图表
    renderChart(results[0].history);

    // 渲染详细分析
    renderDetailedAnalysis(results[0].history);

    // 显示结果区域
    resultSection.style.display = 'block';
    setTimeout(() => {
        resultSection.classList.add('visible');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function renderChart(history) {
    const ctx = document.getElementById('growthChart').getContext('2d');

    if (state.growthChart) {
        state.growthChart.destroy();
    }

    const displayHistory = history.slice(0, 31); // Limit to 30 years (0-30)

    const labels = displayHistory.map(h => `${h.age}岁`);
    const principals = displayHistory.map(h => h.principal / 10000);
    const targetPrincipals = displayHistory.map(h => (h.adjustedExpense * 12) / (state.rate / 100) / 10000);

    state.growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '名义资产总额 (万元)',
                    data: principals,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#f1f5f9',
                        font: { family: 'Inter' }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value >= 10000 ? (value / 10000).toFixed(1) + '亿' : value + '万';
                        }
                    }
                }
            }
        }
    });
}

function renderDetailedAnalysis(history) {
    const tableBody = document.getElementById('analysis-body');
    if (!tableBody) return;

    tableBody.innerHTML = history.filter((_, i) => i % 1 === 0).map(h => {
        const achievedStatus = h.achieved
            ? '<span class="status-achieved">已达成 ✓</span>'
            : '<span class="status-pending">进行中...</span>';

        // Removed expense column as requested for Real Rate model simplification
        return `
            <tr>
                <td>${h.age} 岁</td>
                <td>¥${formatLargeNumber(h.principal)}</td>
                <td>¥${h.passiveIncome.toLocaleString()}</td>
                <td>${achievedStatus}</td>
            </tr>
        `;
    }).join('');
}

function formatLargeNumber(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(2) + ' 亿元';
    }
    return (num / 10000).toFixed(0) + ' 万元';
}

// ========================================
// Event Handlers
// ========================================

function handleCalculate() {
    const results = generateResults();
    renderResults(results);

    // Add haptic feedback (visual)
    const button = document.getElementById('calculate-btn');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 100);
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize pickers
    const pickers = {
        principal: new Picker('principal-picker', 'principal', CONFIG.principal),
        rate: new Picker('rate-picker', 'rate', CONFIG.rate),
        income: new Picker('income-picker', 'income', CONFIG.income),
        currentExpense: new Picker('current-expense-picker', 'currentExpense', CONFIG.currentExpense),
        inflation: new Picker('inflation-picker', 'inflation', CONFIG.inflation),
        age: new Picker('age-picker', 'age', CONFIG.age)
    };

    // Attach calculate button
    document.getElementById('calculate-btn').addEventListener('click', handleCalculate);

    // Initial calculation (optional - show results immediately)
    // Uncomment the line below if you want to show initial results
    // setTimeout(handleCalculate, 500);
});

// ========================================
// Utility Functions
// ========================================

// Format number with commas
function formatNumber(num) {
    return num.toLocaleString('zh-CN');
}

// Format currency
function formatCurrency(num) {
    if (num >= 10000) {
        return `¥${(num / 10000).toFixed(1)} 万`;
    }
    return `¥${num.toLocaleString()} `;
}
