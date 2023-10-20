// Tariflerin listelendiği container'ı seçin
const recipeContainer = document.getElementById('recipeContainer');
// Tarif eklemek için formu seçin
const recipeForm = document.getElementById('recipeForm');
var data;
var currentRecipes;
let selectedType;
var selectedRecipe;
firebase.database().ref("/").on("value", (snapshot) => {
    data = transformData(snapshot.val());
    currentRecipes = data;
    displayRecipes(data);

})

function transformData(data) {
    const result = [];

    for (const key in data) {
        const item = data[key];
        item.id = key;
        result.push(item);
    }

    return result;
}
function compressImage(base64Data, outputFormat = 'image/jpeg', quality = 0.5, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = base64Data;

        img.onload = function () {
            let canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            const newDataUri = canvas.toDataURL(outputFormat, quality);
            resolve(newDataUri);
        };

        img.onerror = function () {
            reject(new Error("Resim yüklenirken bir hata oluştu."));
        };
    });
}


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
    const avgPreparationTime = document.getElementById("avgPreparationTime").value

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
        compressImage(imageBase64).then(compressedData => {

            const DATE_NOW = new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR');

            const selectElement = document.getElementById("recipeFilterAdd");
            const selectedValue = selectElement.options[selectElement.selectedIndex].value;
            console.log(selectedValue);

            var insertData = {
                "avgFinish": avgPreparationTime,
                "createDate": DATE_NOW,
                "detail": description,
                "image": compressedData,
                "name": title,
                "type": selectedValue,
                "updateDate": DATE_NOW
            }

            firebase.database().ref("/").push().set(insertData, error => {
                if (error) {
                    throw new Error("insert comment error", error).stack;
                }
                else {
                    console.log("tarif eklendi.");
                }
            })

        }).catch(error => {
            console.error(error);
        });
    } catch (error) {
        console.error("Resim dönüştürme hatası:", error);
        return;
    }
});




function displayRecipes(recipes) {
    const recipeCards = document.getElementById("recipeCards");
    recipeCards.innerHTML = ''; // Clear existing cards

    recipes.forEach((recipe, index) => {
        let card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card" data-toggle="modal" data-target="#recipeModal" data-index="${index}">
                <img class="card-img-top recipe-image" id="${recipe.id}" src="${recipe.image}" alt="${recipe.name}" height = "200px">
                <input type="file" class="recipe-image-input" style="display: none;" accept="image/*">
                <button class="btn btn-primary change-image-btn">Fotoğrafı Değiştir</button>
                <div class="card-body">
                    <h5 class="card-title">${recipe.name}</h5>
                    <div class="avg-time">Ortalama Hazırlanış Süresi: ${recipe.avgFinish} dk</div>
                    <div class="receipeCreateDate">Oluşturulma Tarihi: <span style="font-weight:bold">${recipe.createDate}</span></div>
                    <div class="receipeCreateDate">Son Güncelleme Tarihi: <span style="font-weight:bold">${recipe.updateDate}</span></div>
                    <button class="btn-delete ${recipe.id}" id="btn-delete">Tarifi Sil</button>
                </div>
            </div>
        `;
        card.querySelector(".change-image-btn").addEventListener("click", function () {
            event.stopPropagation();
            const fileInput = card.querySelector(".recipe-image-input");
            fileInput.click();
        });

        card.querySelector(".btn-delete").addEventListener("click", function (event) {
            event.stopPropagation();
            if (confirm(currentRecipes.filter(i=>i.id==event.currentTarget.className.split(" ")[1])[0].name + " Tarifin silinecek. Onaylıyor musun?")) {
                firebase.database().ref(event.currentTarget.className.split(" ")[1]).remove()
                .then(function () {
                    console.log("Tarif silindi!");
                })
                .catch(function (error) {
                    throw new Error("delete tarif error", error).stack;
                });
            }

        });

        card.querySelector(".recipe-image-input").addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    compressImage(e.target.result).then(compressedData => {
                        const DATE_NOW = new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR');
                        firebase.database().ref(card.querySelector(".recipe-image").id).update({ image: compressedData, updateDate: DATE_NOW }, (error) => {
                            if (error) {
                                console.log("ERROR", error);
                            } else {
                                console.log("fotoğraf güncellendi");
                                document.getElementById("recipeImage").src = compressedData;
                            }
                        })
                        //card.querySelector(".recipe-image").src = compressedData;

                    }).catch(error => {
                        console.error(error);
                    });

                };
                reader.readAsDataURL(file);
            }
        });

        recipeCards.appendChild(card);
    });
}

// Modal detayını doldurma
$('#recipeModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var index = button.data('index');
    var recipe = currentRecipes[index];
    selectedRecipe = recipe;
    var modal = $(this);
    modal.find('.modal-title').text(recipe.name);
    modal.find('#recipeImage').attr('src', recipe.image);

    var detailsList = recipe.detail.split(',');
    var detailsHtml = '';
    detailsList.forEach((detail, detailIndex) => {
        detailsHtml += `
            <li>
                <span class="detail-text">${detail.trim()}</span>
                <button class="btn-edit-detail" data-detail-index="${detailIndex}">
                    <i class="fas fa-edit"></i>
                </button>
            </li>`;
    });

    modal.find('#recipeDetailList').html(detailsHtml);

    // Butonlara tıklama olayı ekleyelim
    modal.find('.btn-edit-detail').on('click', function () {
        var detailIndex = $(this).data('detail-index');
        var currentDetail = detailsList[detailIndex];
        var newDetail = prompt("Detayı güncelleyin:", currentDetail);
        if (newDetail) {
            detailsList[detailIndex] = newDetail;
            recipe.detail = detailsList.join(','); // Güncellenen detayları tekrar birleştirin
            // Eğer currentRecipes bir global değişken ise ve sonradan kullanılacaksa güncelleyin:
            currentRecipes[index] = recipe;
            const DATE_NOW = new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR');

            firebase.database().ref(recipe.id).update({ detail: recipe.detail, updateDate: DATE_NOW }, (error) => {
                if (error) {
                    console.log("ERROR", error);
                } else {
                    console.log(receipe.title + " detayı güncellendi");
                    // Güncellenen detayları tekrar göstermek için modalı güncelleyin
                    $(this).siblings('.detail-text').text(newDetail);
                }
            })

        }
    });
});
document.getElementById("recipeModalLabel").addEventListener("click", function () {
    var newTitle = prompt("Tarif Başlığını güncelleyin:", this.textContent);
    if (newTitle) {
        const DATE_NOW = new Date().toLocaleDateString('tr-TR', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + new Date().toLocaleTimeString('tr-TR');

        firebase.database().ref(selectedRecipe.id).update({ name: newTitle, updateDate: DATE_NOW }, (error) => {
            if (error) {
                console.log("ERROR", error);
            } else {
                this.textContent = newTitle;
            }
        })
    }
});


document.getElementById("recipeFilter").addEventListener("change", function () {
    selectedType = this.value;
    currentRecipes = data;  // Varsayılan olarak orijinal veri kümesini ayarla

    if (selectedType !== "all") {
        currentRecipes = data.filter(recipe => recipe.type === selectedType);
    }

    displayRecipes(currentRecipes);
});