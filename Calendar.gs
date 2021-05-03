const weeks_brew2bottle = 4; //from brew day to bottle 

const cal_colStart = 3; //C
const cal_colStartL = columnToLetter(cal_colStart);
const cal_colEnd = cal_colStart+11; //Z
const cal_colEndL = columnToLetter(cal_colEnd);
const cal_rowStart = 5; //C
const cal_rowEnd = cal_rowStart+11; //C
const plusRowInst = 5;

const colList = columnToLetter(cal_colStart-1)

const cal_DM_s = cal_rowStart-3; //DM: drinkable month
const cal_DM_e = cal_DM_s+2
const nMonths = 12; //number of months
const drinkDiffMonth = 1;

//get data ranges
const ss = SpreadsheetApp.getActive();
const sheet_beers = ss.getSheetByName('Styles');
const sheet_calendar = ss.getSheetByName('Calendar');

const rangeDataDrinkMonths = sheet_calendar.getRange(cal_colStartL+cal_DM_s+':'+cal_colEndL+cal_DM_e);
const rangeDataBeers = sheet_beers.getDataRange();
const rangeDataCalendar = sheet_calendar.getRange(cal_colStartL+cal_rowStart+':'+cal_colEndL+cal_rowEnd);

function beer_calendar() {
    
    var lastRow = (rangeDataBeers.getLastRow()>1) ? rangeDataBeers.getLastRow() : 2;

    var range_styles_maturation = sheet_beers.getRange('A2:B'+lastRow).getValues();
    var range_brewmonths = rangeDataDrinkMonths.getValues()[0];
    var range_temperatures = rangeDataDrinkMonths.getValues()[1];
    var range_desiredstyles = rangeDataDrinkMonths.getValues()[2];

    var inst_brew = new Array(12);
    var inst_drink = new Array(12);
  
    //empty calendar
    rangeDataCalendar.clearContent();
    
    //set vars
    var row;
    var weeks_drinkable;

    //loop trough months to find maturation periods
    for(i=0;i<range_desiredstyles.length;i++){
      //only for informed values
      if(range_desiredstyles[i]){
        
        //find the beer type to get the carbonation months
        for(j=0;j<range_styles_maturation.length;j++){
          //Logger.log(range_beers[j]);
          var beer_style = '';
          var ready_weeks = '';
          if(range_desiredstyles[i] == range_styles_maturation[j][0]){ //find the right style
            beer_style = range_styles_maturation[j][0];
            weeks_maturation = range_styles_maturation[j][1];
            break;
          }
        }
        
        //now that the maturation was found
        weeks_drinkable = weeks_brew2bottle+weeks_maturation; //calculates maturation weeks
        months_drinkable = Math.ceil(weeks_drinkable/4); //convert to months in X months will be drinkable
        mi = i; //month index, to know which column to start

        baseFillcol = cal_colStart+mi;
        //brew column column
        colB_s = colB_e = baseFillcol-months_drinkable; //define columns for brew/fermentation month (deduct 1 to consider the full month and the drinkable month the following one)
        if(colB_s<cal_colStart){ colB_s+=nMonths; colB_e=colB_s; } //puts at the end of calendar if before january
        //maturation months column
        colM_s = colB_s+1;
        colM_e = colB_s+months_drinkable-drinkDiffMonth;
        colM_s2 = colM_e2 = null;
        if(colM_e>cal_colEnd){ colM_s2 = cal_colStart; colM_e2 = cal_colStart+(colM_e-cal_colEnd)-drinkDiffMonth; colM_e = cal_colEnd; } //stops at end of calendar and set a second range for ths start of the calendar
        //drinkable month
        colD_s = colD_e = (colM_e2) ? colM_e2+1 : colM_e+1;
        colD_s = (colD_s>cal_colEnd) ? colD_s = colD_e = cal_colStart : colD_s;
        
        //set the row to insert values
        row = i+cal_rowStart;
        rangeB = columnToLetter(colB_s)+row+':'+columnToLetter(colB_e)+row;
        rangeM = (colM_s<=cal_colEnd) ? columnToLetter(colM_s)+row+':'+columnToLetter(colM_e)+row : null;
        rangeM2 = (colM_s2) ? columnToLetter(colM_s2)+row+':'+columnToLetter(colM_e2)+row : null; //seta a segunda parte do range if needed
        rangeD = columnToLetter(colD_s)+row+':'+columnToLetter(colD_e)+row;

        //insert values
        sheet_calendar.getRange(rangeB).setValue('brewday');
        if(rangeM){ sheet_calendar.getRange(rangeM).setValue('maturation'); }
        if(rangeM2){ sheet_calendar.getRange(rangeM2).setValue('maturation'); }
        sheet_calendar.getRange(rangeD).setValue('drinkable');
        sheet_calendar.getRange(colList+row+':'+colList+row).setValue(beer_style);

        //set indexes for instructions
        colB_Idx = colB_s-cal_colStart;
        colD_Idx = colD_e-cal_colStart;
        
        //find correct months
        var brew_month = range_brewmonths[colB_Idx].toString();
        var drink_month = range_brewmonths[colD_Idx].toString();

        //creating array if needed
        if(!inst_brew[colB_Idx]){ inst_brew[colB_Idx] = []; }
        if(!inst_drink[colD_Idx]){ inst_drink[colD_Idx] = []; }

        
        
        //add instructions
        inst_brew[colB_Idx].push(beer_style);
        inst_drink[colD_Idx].push(beer_style);

        //log
        Logger.log('In '+drink_month+' we want to drink '+beer_style+'. We need to brew it in '+brew_month+'. It takes '+months_drinkable+' months to maturate. Debug: '+colB_Idx);
        //Logger.log('Brew: '+inst_brew);
        //Logger.log('Drink: '+inst_drink);
      }
    }

    //insert instructions
   
    for(a=0;a<nMonths;a++){
      
      //set first row for placing instructions
      var r=cal_rowEnd+plusRowInst;
      var cL = columnToLetter(cal_colStart+a);

      //clear contents
      sheet_calendar.getRange(cL+r+':'+cal_colEndL).clearContent();

      //set headers
      sheet_calendar.getRange(cL+r).setValue(range_brewmonths[a]); //inserting month
      r++;
      
      //insert brew instructions
      if(inst_brew[a]){ //only if have instructions
        sheet_calendar.getRange(cL+r).setValue('To brew:'); //insert separation => brew
        r++;
        //loop trough instructions to brew in that month
        for(b=0;b<inst_brew[a].length;b++){
          sheet_calendar.getRange(cL+r).setValue(inst_brew[b]); //inserting month
          r++;
        }
        //Logger.log('Inserting in '+range_brewmonths[a]);
        r++;
      }

      //insert drink instructions
      if(inst_drink[a]){ //only if have instructions
        sheet_calendar.getRange(cL+r).setValue('Drinkable:'); //insert separation => brew
        r++;
        //loop trough instructions to brew in that month
        for(b=0;b<inst_drink[a].length;b++){
          sheet_calendar.getRange(cL+r).setValue(inst_drink[b]); //inserting month
          r++;
        }
        //Logger.log('Inserting instructions in '+range_brewmonths[a]);
        r++;
      }

    }
    
    //transpose array
    //instructions.map((_, colIndex) => instructions.map(row => row[colIndex]));

    /* OLD CODE, WAS DOING BASED ON THE BREW MONTHS, TOO DIFFICULT TO ALIGN
    //loop trough months to apply the rules
    for(i=0;i<range_brewmonths.length;i++){
      //Logger.log(range_brewmonths[i]);
      //only if style is specified
      if(range_brewmonths[i][1]){
        //set the row
        row = i+cal_rowStart;
        //find the beer type
        for(j=0;j<range_beers.length;j++){
          //Logger.log(range_beers[j]);
          var style = '';
          var ready_weeks = '';
          if(range_brewmonths[i][1] == range_beers[j][0]){ //find the right style
            style = range_beers[j][0];
            weeks_maturation = range_beers[j][1];
            break;
          }
        }
        //calculates drinkable weeks
        weeks_drinkable = weeks_brew2bottle+weeks_maturation;
        //convert to months
        months_drinkable = Math.ceil(weeks_drinkable/4); //in x months will be drinkable
        //gets the month to start coloring
        var mi = new Date(1+' '+range_brewmonths[i][0]).getMonth()+1; //month index
        startCol = mi+cal_colStart;
        //find the column indexes
        col_s1 = col_e1 = startCol;
        col_s2 = startCol+1;
        col_e2 = col_s2+months_drinkable-2;
        col_s3 = col_e3 = col_e2+1;
        //adicionar os valores nas células
        sheet_calendar.getRange(columnToLetter(col_s1)+row+':'+columnToLetter(col_e1)+row).setValue('m');
        sheet_calendar.getRange(columnToLetter(col_s2)+row+':'+columnToLetter(col_e2)+row).setValue('c');
        sheet_calendar.getRange(columnToLetter(col_s3)+row+':'+columnToLetter(col_e3)+row).setValue(1);
        //Logger.log(style+' drinkable in '+months_drinkable+' months. '+col_s1+','+col_e1+','+col_s2+','+col_e2+','+col_s3+','+col_s3);
      }
    }
    */
}

function columnToLetter(column)
{
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function letterToColumn(letter)
{
  var column = 0, length = letter.length;
  for (var i = 0; i < length; i++)
  {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

function onEdit(e) {
  var ui = SpreadsheetApp.getUi();
  var spread = SpreadsheetApp.getActiveSpreadsheet();
  
  // Set a comment on the edited cell to indicate when it was changed.
  var acs = e.source.getActiveSheet().getName()=='Calendar';
  var m1 = e.range.columnStart>=cal_colStart;
  var m2 = e.range.columnEnd<=cal_colEnd;
  var rs = e.range.rowStart == (cal_rowStart-1);
  


  
  if(acs && m1 && m2 && rs) {
    spread.toast('Updating calendar...');
    beer_calendar();
  }
}
