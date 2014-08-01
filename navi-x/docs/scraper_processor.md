#Overview

The purpose of the scraper processor is to function as an online plugin for Navi-X which produces dynamic plx pages. 
By loading the URL that contains the scraper processor, Navi-X can parse and execute it, generating a dynamic page, 
allowing this way to reduce costs of server maintenance and others.

In order to create a processor, you will need three main skills.

    The ability to manually figure out final media URLs and other parameters by hand from the site you're trying to create a processor for
    Writing and understanding regular expressions
    Programming in a "web language" - PHP, Perl, ASP, etc (Not necessary for most processors)

Please note that this is not meant to serve as a tutorial for any of the above skills. If it were, it would be WAY too 
big, not to mention that it would take WAY too long to write. :)

A processor is nothing more than a plain text set of instructions in the form of "Navi-X Instructional Processor 
Language", also known as "NIPL script" (pronounced "nipple", of course). This can normally be stored as a plain text 
file.

NIPL Reference

This page may look intimidating, but it's really not so bad; it's just long because I tried to document everything 
thoroughly. NIPL is a simple, top-down, not-very-fancy scripting language. There are only two things about NIPL that 
are a little different than most languages. The first is that its functions don't take a lot of arguments; you set the 
parameters for a function one line at a time before you call it. The second is the way you assign string values to a 
variable by using a single apostrophe before the value. All of this is covered below, so read on. For debugging, you 
can use the processor test bed to see what's happening behind the scenes.

