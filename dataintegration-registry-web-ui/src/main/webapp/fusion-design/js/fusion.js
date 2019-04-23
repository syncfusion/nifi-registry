        $(document).ready(function () {

            // Intial Border Position
            var activePos = $('.tabs-header .active').position();
            var hoverPos = $('.tabs-header .active1').position();


            // Change Position
            function changePos() {

                // Update Position
                activePos = $('.tabs-header .active').position();

                // Change Position & Width
                $('.border').stop().css({
                    left: activePos.left,
                    width: $('.tabs-header .active').width()
                });

            }
            changePos();


            // Intial Tab Height
            var tabHeight = $('.tab.active').height();
            var tabHeight1 = $('.tab.active1').height();


            // Animate Tab Height
            function animateTabHeight() {

                // Update Tab Height
                tabHeight = $('.tab.active').height();
                tabHeight1 = $('.tab.active1').height();

                // Animate Height
                $('.tabs-content').stop().css({
                    height: tabHeight + 'px'
                });
                $('.tabs-content').stop().css({
                    height: tabHeight1 + 'px'
                });
            }

            animateTabHeight();

            // Change Tab
            function changeTab() {
                var getTabId = $('.tabs-header .active a').attr('tab-id');

                // Remove Active State
                $('.tab').stop().fadeOut(300, function () {
                    // Remove Class
                    $(this).removeClass('active');
                }).hide();

                $('.tab[tab-id=' + getTabId + ']').stop().fadeIn(300, function () {
                    // Add Class
                    $(this).addClass('active');

                    // Animate Height
                    animateTabHeight();
                });
            }

            // Tabs active
            $('.tabs-header a').on('click', function (e) {
                e.preventDefault();

                // Tab Id
                var tabId = $(this).attr('tab-id');

                // Remove Active State
                $('.tabs-header a').stop().parent().removeClass('active');

                // Add Active State
                $(this).stop().parent().addClass('active');

                changePos();

                // Update Current Itm
                tabCurrentItem = tabItems.filter('.active');

                // Remove Active State
                $('.tab').stop().fadeOut(300, function () {
                    // Remove Class
                    $(this).removeClass('active');
                }).hide();

                // Add Active State
                $('.tab[tab-id="' + tabId + '"]').stop().fadeIn(300, function () {
                    // Add Class
                    $(this).addClass('active');

                    // Animate Height
                    animateTabHeight();
                });
            });

            // Tab Items
            var tabItems = $('.tabs-header ul li');

            // Tab Current Item
            var tabCurrentItem = tabItems.filter('.active');

            // Next Button
            $('#next').on('click', function (e) {
                e.preventDefault();

                var nextItem = tabCurrentItem.next();

                tabCurrentItem.removeClass('active');

                if (nextItem.length) {
                    tabCurrentItem = nextItem.addClass('active');
                } else {
                    tabCurrentItem = tabItems.first().addClass('active');
                }

                changePos();
                changeTab();
            });

            // Prev Button
            $('#prev').on('click', function (e) {
                e.preventDefault();

                var prevItem = tabCurrentItem.prev();

                tabCurrentItem.removeClass('active');

                if (prevItem.length) {
                    tabCurrentItem = prevItem.addClass('active');
                } else {
                    tabCurrentItem = tabItems.last().addClass('active');
                }

                changePos();
                changeTab();
            });

            // Ripple
            $('[ripple]').on('click', function (e) {
                var rippleDiv = $('<div class="ripple" />'),
                    rippleOffset = $(this).offset(),
                    rippleY = e.pageY - rippleOffset.top,
                    rippleX = e.pageX - rippleOffset.left,
                    ripple = $('.ripple');

                rippleDiv.css({
                    top: rippleY - (ripple.height() / 2),
                    left: rippleX - (ripple.width() / 2),
                    background: $(this).attr("ripple-color")
                }).appendTo($(this));

                window.setTimeout(function () {
                    rippleDiv.remove();
                }, 1500);
            });

            $("li").hover(function () {
                $(this).toggleClass("tab_hover");
            });
        });
            //# sourceURL=pen.js


            
            $(".f-toast-trigger").click(function (e) {
                e.preventDefault();
                datatoast = $(this).attr("data-toast");
                if ($(this).hasClass("toast-auto") && !$("#" + datatoast).is(":visible")) {
                    $("#" + datatoast).fadeIn(400).delay(4000).fadeOut(400);
                }
                else if (!$("#" + datatoast).is(":visible")) {
                    $("#" + datatoast).fadeIn(400);
                };
            });
            $(".f-close-toast").click(function (e) {
                e.preventDefault();
                closetoast = $(this).parent().attr("id");
                $("#" + closetoast).fadeOut(400);
            });




        $(".f-dropdown").on("click", function (e) {
            e.preventDefault();

            if ($(this).hasClass("open")) {
                $(this).removeClass("open");
                $(this).children("ul").slideUp("medium");
            } else {
                $(this).addClass("open");
                $(this).children("ul").slideDown("medium");
            }
        });
