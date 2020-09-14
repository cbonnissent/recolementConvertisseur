var inputElement = document.getElementById("input");
inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {
  //Get the first file
  var file = this.files[0];
  //Read the content
  new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (content) {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file, "ISO-8859-15");
  }).then(function (fileContent) {
    var result = Papa.parse(fileContent, {
      "delimiter": ";",
      "newLine": "\n",
      header: true
    });
    return result;
  }).then(function (result) {
    return result.data.reduce(function (acc, currentLine) {
      var emplacement = "loc actu";
      //No emplacement, we let the element as is
      currentLine.emplacement = currentLine[emplacement];
      if (currentLine.emplacement === undefined) {
        return acc;
      }
      acc.push(currentLine);
      return acc;
    }, []);
  }).then(function (splittedList) {
    return splittedList.reduce(function (acc, currentLine) {
      //Detect if multiple loc
      console.log(currentLine.emplacement);
      if (currentLine.emplacement.indexOf(")  + ") > -1) {
        currentLine.reserve = "multiloc";
        currentLine.loc = currentLine.emplacement;
        acc.push(currentLine);
        return acc;
      }
      var splitExp = /(FRAC-R\d+).*/;
      if (!currentLine.emplacement) {
        acc.push(currentLine);
        return acc;
      }
      //Split emplacement
      var result = splitExp.exec(currentLine.emplacement);
      if (result === null) {
        console.log("échec regexp", currentLine);
        currentLine.reserve = "extérieur";
        acc.push(currentLine);
        return acc;
      }
      currentLine.reserve = result[1] || "";
      acc.push(currentLine);
      return acc;
    }, []);
  }).then(function (analyzedArray) {
    return analyzedArray.reduce(function (acc, currentLine) {
      if (currentLine.reserve === "extérieur") {
        acc.tableExt.push(currentLine);
      }
      if (currentLine.reserve === "FRAC-R1") {
        acc.tableR1.push(currentLine);
      }
      if (currentLine.reserve === "FRAC-R2") {
        acc.tableR2.push(currentLine);
      }
      if (currentLine.reserve === "FRAC-R3") {
        acc.tableR3.push(currentLine);
      }
      if (currentLine.reserve === "FRAC-R4") {
        acc.tableR4.push(currentLine);
      }
      if (currentLine.reserve === "multiloc") {
        acc.tableMultiloc.push(currentLine);
      }
      return acc;
    }, {
      "tableExt": [],
      "tableR1": [],
      "tableR2": [],
      "tableR3": [],
      "tableR4": [],
      "tableMultiloc": []
    });
  }).then(function (finalList) {
    const generateTable = function(currentList) {
      var asHTML = currentList.reduce(function (acc, currentLine) {
        return acc +
          "\n" +
          "<tr>" +
          "<td>" + (currentLine["Auteur(s)"] || "") + "</td>" +
          "<td>" + (currentLine["Titre usuel"] || "") + "</td>" +
          "<td>" + (currentLine["n° inv."] || "") + "</td>" +
          "<td>" + (currentLine["mat-sup-tech"] || "") + "</td>" +
          "<td>" + (currentLine["reserve"] || "") + "</td>" +
          "<td>" + (currentLine["loc actu"] || "") + "</td>" +
          "<td>" + (currentLine["emplacement usuel"] || "") + "</td>" +
          "<td>☐</td>" +
          "</tr>";
      }, "<tbody>");
      asHTML += "</tbody>";
      return asHTML;
    }
    var orderElement = function (first, second) {
      var reserveFirst = (first["loc actu"] ? first["loc actu"].toUpperCase() : "ø")+""+(first["Auteur(s)"] ? first["Auteur(s)"].toUpperCase() : "ø");
      var reserveSecond = (second["loc actu"] ? second["loc actu"].toUpperCase() : "ø")+""+(second["Auteur(s)"] ? second["Auteur(s)"].toUpperCase() : "ø");
      if (reserveFirst > reserveSecond) {
        return 1;
      }
      if (reserveFirst < reserveSecond) {
        return -1;
      }
      return 0;
    };
    document.getElementById('tableExt').innerHTML = generateTable(finalList.tableExt.sort(orderElement));
    document.getElementById('tableR1').innerHTML = generateTable(finalList.tableR1.sort(orderElement));
    document.getElementById('tableR2').innerHTML = generateTable(finalList.tableR2.sort(orderElement));
    document.getElementById('tableR3').innerHTML = generateTable(finalList.tableR3.sort(orderElement));
    document.getElementById('tableR4').innerHTML = generateTable(finalList.tableR4.sort(orderElement));
    document.getElementById('tableMultiloc').innerHTML = generateTable(finalList.tableMultiloc.sort(orderElement));
  }).catch(function (error) {
    debugger;
    alert(JSON.stringify(error));
  });
}