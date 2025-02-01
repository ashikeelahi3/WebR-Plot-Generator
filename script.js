import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';

const webR = new WebR({ interactive: false });
let packagesInstalled = false;

async function initializeWebR() {
  const outElem = document.getElementById('out');
  const loadingElem = document.querySelector('.loading');
  const progressBar = document.querySelector('.progress-bar');
  const progressText = document.querySelector('.progress-text');
  const statusMessage = document.querySelector('.status-message');
  
  try {
    loadingElem.style.display = 'inline-block';
    progressBar.style.display = 'block';
    
    // Initialize WebR (20%)
    outElem.innerText = 'Initializing WebR...';
    progressBar.style.width = '20%';
    progressText.innerText = '20%';
    await webR.init();
    
    // Install packages (20% to 100%)
    outElem.innerText = 'Installing required packages...';
    const packages = ['ggplot2', 'plotly', 'purrr', 'dplyr'];
    for (let i = 0; i < packages.length; i++) {
      progressBar.style.width = `${20 + ((i + 1) * 20)}%`;
      progressText.innerText = `${20 + ((i + 1) * 20)}%`;
      await webR.installPackages([packages[i]], true);
    }
    
    packagesInstalled = true;
    outElem.innerText = 'WebR initialized. Ready for input.';
    loadingElem.style.display = 'none';
    progressBar.style.display = 'none';
    statusMessage.classList.add('success');
  } catch (error) {
    console.error('Error during initialization:', error);
    outElem.innerText = 'Error initializing WebR. Please refresh the page.';
    loadingElem.style.display = 'none';
    progressBar.style.display = 'none';
    statusMessage.classList.add('error');
  }
}

async function generatePlot() {
  const outElem = document.getElementById('out');
  const loadingElem = document.querySelector('.loading');
  const progressBar = document.querySelector('.progress-bar');
  const progressText = document.querySelector('.progress-text');
  const statusMessage = document.querySelector('.status-message');
  const plotContainer = document.getElementById('plot-container');
  const sampleSizeInput = document.getElementById('sampleSizeInput').value;

  const sampleSize = parseInt(sampleSizeInput, 10);
  if (isNaN(sampleSize) || sampleSize <= 0) {
    alert('Please enter a valid positive integer for the sample size.');
    return;
  }

  if (!packagesInstalled) {
    alert('Please wait for package installation to complete.');
    return;
  }

  loadingElem.style.display = 'inline-block';
  progressBar.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.innerText = '0%';
  statusMessage.classList.remove('success', 'error');
  outElem.innerText = 'Generating Plot, Please wait...';
  plotContainer.style.display = 'none';

  try {
    // Start plot generation (50%)
    progressBar.style.width = '50%';
    progressText.innerText = '50%';
    
    const plotlyData = await webR.evalRString(`
    library(plotly)
    library(ggplot2)
    library(purrr)
    library(dplyr)

    sampleSize <- ${sampleSize}
    meanBinom <- 1:sampleSize %>%
        map_dbl(
            function(i){
                mean(rbinom(size=1, n=i, prob=0.5))
            }
        )
    df <- data.frame(n = c(1:sampleSize), meanBinom=meanBinom)
    p <- ggplot() +
            geom_point(
                data = df,
                aes(
                    x = n, 
                    y = meanBinom
                ),
                color = "#667eea",
                size = 3,
                alpha = 0.7
            ) +
            geom_hline(yintercept=0.5, linetype="dashed", color="#764ba2", size=1) +
            xlab("Sample Size") +
            ylab("Mean") +
            ylim(c(0,1)) +
            theme_minimal() +
            theme(
                panel.grid.major = element_line(color = "#e0e0e0"),
                panel.grid.minor = element_blank(),
                axis.line = element_line(color = "#333333"),
                axis.text = element_text(size = 12),
                axis.title = element_text(size = 14, face = "bold"),
                plot.background = element_rect(fill = "white")
            )

    plotly_json(p, pretty = FALSE)
    `);

    // Process data (75%)
    progressBar.style.width = '75%';
    progressText.innerText = '75%';
    outElem.replaceChildren();
    const plotData = JSON.parse(plotlyData);
    
    // Render plot (100%)
    progressBar.style.width = '100%';
    progressText.innerText = '100%';
    
    loadingElem.style.display = 'none';
    progressBar.style.display = 'none';
    plotContainer.style.display = 'block';
    statusMessage.style.display = 'none';
    
    // Custom Plotly layout
    const layout = {
      autosize: true,
      margin: { l: 50, r: 30, t: 30, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Inter, sans-serif'
      },
      xaxis: {
        gridcolor: '#e0e0e0',
        zerolinecolor: '#333333',
        title: {
          font: {
            size: 14,
            weight: 600
          }
        }
      },
      yaxis: {
        gridcolor: '#e0e0e0',
        zerolinecolor: '#333333',
        title: {
          font: {
            size: 14,
            weight: 600
          }
        }
      },
      hoverlabel: {
        bgcolor: '#667eea',
        font: { color: 'white' }
      }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      displaylogo: false
    };

    Plotly.newPlot('plot-container', plotData, layout, config);
    
    // Add resize listener for responsiveness
    window.addEventListener('resize', () => {
      Plotly.Plots.resize('plot-container');
    });

  } catch (error) {
    console.error('Error generating plot:', error);
    outElem.innerText = 'Error generating plot. Please try again.';
    loadingElem.style.display = 'none';
    progressBar.style.display = 'none';
    statusMessage.classList.add('error');
    plotContainer.style.display = 'none';
  }
}

// Initialize WebR when the page loads
initializeWebR();

// Add event listener to the button
document.getElementById('generatePlot').addEventListener('click', generatePlot);