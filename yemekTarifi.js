// Tariflerin listelendiği container'ı seçin
const recipeContainer = document.getElementById('recipeContainer');
// Tarif eklemek için formu seçin
const recipeForm = document.getElementById('recipeForm');

// Fotoğrafı base64 formatına çevirip boyutunu düşüren fonksiyon
async function resizeAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = 800;
                const scale = maxWidth / img.width;
                const newWidth = img.width * scale;
                const newHeight = img.height * scale;
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = (error) => {
                reject(error);
            };
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
}

// Tarif eklemek için formun gönderilmesini dinleyin
recipeForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Kullanıcının girdiği bilgileri alın
    const title = document.getElementById('recipeTitle').value;
    const description = document.getElementById('recipeDescription').value;

    // Dosya seçimi kontrolü
    const imageInput = document.getElementById('recipeImageUpload');
    if (!imageInput || !imageInput.files || imageInput.files.length === 0) {
        console.error("Lütfen bir resim seçin.");
        return;
    }
    const image = imageInput.files[0];

    let imageBase64;
    try {
        imageBase64 = await resizeAndConvertToBase64(image);
    } catch (error) {
        console.error("Resim dönüştürme hatası:", error);
        return;
    }

    // Tarif kartını oluşturun
    const recipeCard = document.createElement('div');
    recipeCard.classList.add('recipe-card');

    // Tarif başlığını ekleyin
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    recipeCard.appendChild(titleElement);

    // Tarif açıklamasını ekleyin
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = description;
    recipeCard.appendChild(descriptionElement);

    // Fotoğrafı ekleyin
    const imageElement = document.createElement('img');
    imageElement.src = imageBase64;
    recipeCard.appendChild(imageElement);

    // Tarif kartını sayfaya ekleyin
    recipeContainer.appendChild(recipeCard);

    // Formu temizleyin
    recipeForm.reset();
});


var data = [
    {
        "name": "Omlet Tava",
        "image": "https://cdn.yemek.com/mncrop/600/315/uploads/2018/08/peynirli-omlet-asama-9.jpg",
        "detail": "2 Bardak Süt, 5 Yumurta, Yağ, Tuz, Yumurtaları bir kaba kır ve süt döküp karıştır,ardından tuzunu dök ve yağını koy,pişir",
        "type": "Kahvaltılık",
        "avgFinish": "35"//min
    },
    {
        "name": "Mercimek Çorbası",
        "image": "https://cdn.yemek.com/mnresize/940/940/uploads/2014/06/mercimek-corbasi-yemekcom.jpg",
        "detail": "3 yemek kaşığı ayçiçek yağı,1 adet kuru soğan,1 yemek kaşığı un,1 adet havuç,1 adet patates",
        "type": "Çorbalar",
        "avgFinish": "45"//min
    },
    {
        "name": "Revani",
        "image": "https://cdn.yemek.com/mnresize/940/940/uploads/2014/06/revani-yemekcom.jpg",
        "detail": "3 adet yumurta,1 çay bardağı toz şeker,1 çay bardağı ayçiçek yağı,1 su bardağı irmik,1.5 su bardağı un",
        "type": "Tatlılar",
        "avgFinish": "65"//min
    }
];

// Yeni bir üst kapsamdaki değişken
var currentRecipes = data;

function displayRecipes(recipes) {
    const recipeCards = document.getElementById("recipeCards");
    recipeCards.innerHTML = ''; // Clear existing cards

    recipes.forEach((recipe, index) => {
        let card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
    <div class="card" data-toggle="modal" data-target="#recipeModal" data-index="${index}">
        <img class="card-img-top" src="${recipe.image}" alt="${recipe.name}">
        <div class="card-body">
            <h5 class="card-title">${recipe.name}</h5>
            <div class="avg-time">Ortalama Hazırlanış Süresi: ${recipe.avgFinish} dk</div>
        </div>
    </div>
`;
        recipeCards.appendChild(card);
    });
}

document.getElementById("recipeFilter").addEventListener("change", function () {
    let selectedType = this.value;
    currentRecipes = data;  // Varsayılan olarak orijinal veri kümesini ayarla

    if (selectedType !== "all") {
        currentRecipes = data.filter(recipe => recipe.type === selectedType);
    }

    displayRecipes(currentRecipes);
});

// Modal detayını doldurma
$('#recipeModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var index = button.data('index');
    var recipe = currentRecipes[index];  // currentRecipes dizisini kullan
    var modal = $(this);
    modal.find('.modal-title').text(recipe.name);
    modal.find('#recipeImage').attr('src', recipe.image);

    var detailsList = recipe.detail.split(',');
    var detailsHtml = '';
    detailsList.forEach(detail => {
        detailsHtml += `<li>${detail.trim()}</li>`;
    });
    modal.find('#recipeDetailList').html(detailsHtml);
});

// Başlangıçta tüm tarifleri göster
displayRecipes(currentRecipes);